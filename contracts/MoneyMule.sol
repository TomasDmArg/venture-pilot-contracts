// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MoneyMule
 * @dev Milestone-based funding platform for hackathon demonstration
 * @author MoneyMule Team
 */
contract MoneyMule is ReentrancyGuard, Ownable, Pausable {
    // Enums
    enum FundingStatus { Active, Completed, Failed, Cancelled }
    enum MilestoneStatus { Pending, Completed, Failed, Disputed }

    // Structs
    struct FundingRound {
        uint256 id;
        address founder;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        FundingStatus status;
        uint256 createdAt;
        uint256 milestonesCount;
        mapping(address => uint256) investments;
        mapping(address => bool) whitelist;
    }

    struct Milestone {
        uint256 id;
        uint256 roundId;
        string description;
        uint256 fundingAmount;
        uint256 completedAt;
        MilestoneStatus status;
        bool fundsReleased;
    }

    // State variables
    uint256 private _nextRoundId = 1;
    uint256 private _nextMilestoneId = 1;
    
    mapping(uint256 => FundingRound) public fundingRounds;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => uint256[]) public roundMilestones; // roundId => milestoneIds
    mapping(address => uint256[]) public investorRounds; // investor => roundIds
    
    // Oracle delay for milestone verification (24 hours for demo)
    uint256 public constant VERIFICATION_DELAY = 24 hours;
    
    // Events
    event FundingRoundCreated(
        uint256 indexed roundId,
        address indexed founder,
        uint256 targetAmount,
        uint256 deadline,
        uint256 milestonesCount
    );
    
    event InvestorWhitelisted(uint256 indexed roundId, address indexed investor);
    event InvestmentMade(uint256 indexed roundId, address indexed investor, uint256 amount);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 indexed roundId);
    event FundsReleased(uint256 indexed milestoneId, uint256 indexed roundId, uint256 amount);
    event InvestmentWithdrawn(uint256 indexed roundId, address indexed investor, uint256 amount);
    event FundingRoundCancelled(uint256 indexed roundId);
    
    // Modifiers
    modifier onlyFounder(uint256 roundId) {
        require(fundingRounds[roundId].founder == msg.sender, "Not the founder");
        _;
    }
    
    modifier onlyWhitelisted(uint256 roundId) {
        require(fundingRounds[roundId].whitelist[msg.sender], "Not whitelisted");
        _;
    }
    
    modifier validRound(uint256 roundId) {
        require(fundingRounds[roundId].id != 0, "Round does not exist");
        _;
    }
    
    modifier validMilestone(uint256 milestoneId) {
        require(milestones[milestoneId].id != 0, "Milestone does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new funding round with milestones
     * @param targetAmount The funding target amount
     * @param deadline The deadline for funding
     * @param milestoneDescriptions Array of milestone descriptions
     * @param milestoneFunding Array of funding amounts for each milestone
     */
    function createFundingRound(
        uint256 targetAmount,
        uint256 deadline,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneFunding
    ) external whenNotPaused returns (uint256) {
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(milestoneDescriptions.length > 0, "At least one milestone required");
        require(milestoneDescriptions.length == milestoneFunding.length, "Mismatched milestone data");
        
        // Verify total milestone funding equals target amount
        uint256 totalMilestoneFunding = 0;
        for (uint256 i = 0; i < milestoneFunding.length; i++) {
            totalMilestoneFunding += milestoneFunding[i];
        }
        require(totalMilestoneFunding == targetAmount, "Milestone funding must equal target amount");
        
        uint256 roundId = _nextRoundId++;
        
        // Initialize funding round
        FundingRound storage round = fundingRounds[roundId];
        round.id = roundId;
        round.founder = msg.sender;
        round.targetAmount = targetAmount;
        round.deadline = deadline;
        round.status = FundingStatus.Active;
        round.createdAt = block.timestamp;
        round.milestonesCount = milestoneDescriptions.length;
        
        // Create milestones
        for (uint256 i = 0; i < milestoneDescriptions.length; i++) {
            uint256 milestoneId = _nextMilestoneId++;
            
            milestones[milestoneId] = Milestone({
                id: milestoneId,
                roundId: roundId,
                description: milestoneDescriptions[i],
                fundingAmount: milestoneFunding[i],
                completedAt: 0,
                status: MilestoneStatus.Pending,
                fundsReleased: false
            });
            
            roundMilestones[roundId].push(milestoneId);
        }
        
        emit FundingRoundCreated(roundId, msg.sender, targetAmount, deadline, milestoneDescriptions.length);
        return roundId;
    }

    /**
     * @dev Whitelist an investor for a funding round
     * @param roundId The funding round ID
     * @param investor The investor address to whitelist
     */
    function whitelistInvestor(uint256 roundId, address investor) 
        external 
        validRound(roundId) 
        onlyFounder(roundId) 
    {
        require(investor != address(0), "Invalid investor address");
        require(fundingRounds[roundId].status == FundingStatus.Active, "Round not active");
        
        fundingRounds[roundId].whitelist[investor] = true;
        emit InvestorWhitelisted(roundId, investor);
    }

    /**
     * @dev Invest in a funding round
     * @param roundId The funding round ID
     */
    function invest(uint256 roundId) 
        external 
        payable 
        validRound(roundId) 
        onlyWhitelisted(roundId) 
        nonReentrant 
        whenNotPaused 
    {
        FundingRound storage round = fundingRounds[roundId];
        
        require(round.status == FundingStatus.Active, "Round not active");
        require(block.timestamp <= round.deadline, "Deadline passed");
        require(msg.value > 0, "Investment amount must be greater than 0");
        require(round.currentAmount + msg.value <= round.targetAmount, "Exceeds target amount");
        
        // Record investment
        if (round.investments[msg.sender] == 0) {
            investorRounds[msg.sender].push(roundId);
        }
        
        round.investments[msg.sender] += msg.value;
        round.currentAmount += msg.value;
        
        // Check if funding is complete
        if (round.currentAmount == round.targetAmount) {
            round.status = FundingStatus.Completed;
        }
        
        emit InvestmentMade(roundId, msg.sender, msg.value);
    }

    /**
     * @dev Mark a milestone as completed (founder only)
     * @param milestoneId The milestone ID
     */
    function completeMilestone(uint256 milestoneId) 
        external 
        validMilestone(milestoneId) 
        whenNotPaused 
    {
        Milestone storage milestone = milestones[milestoneId];
        uint256 roundId = milestone.roundId;
        
        require(fundingRounds[roundId].founder == msg.sender, "Not the founder");
        require(milestone.status == MilestoneStatus.Pending, "Milestone not pending");
        require(fundingRounds[roundId].status == FundingStatus.Completed, "Round not completed");
        
        milestone.status = MilestoneStatus.Completed;
        milestone.completedAt = block.timestamp;
        
        emit MilestoneCompleted(milestoneId, roundId);
    }

    /**
     * @dev Release funds for a completed milestone (with verification delay)
     * @param milestoneId The milestone ID
     */
    function releaseFunds(uint256 milestoneId) 
        external 
        validMilestone(milestoneId) 
        nonReentrant 
        whenNotPaused 
    {
        Milestone storage milestone = milestones[milestoneId];
        uint256 roundId = milestone.roundId;
        FundingRound storage round = fundingRounds[roundId];
        
        require(round.founder == msg.sender, "Not the founder");
        require(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
        require(!milestone.fundsReleased, "Funds already released");
        require(
            block.timestamp >= milestone.completedAt + VERIFICATION_DELAY,
            "Verification delay not met"
        );
        
        milestone.fundsReleased = true;
        
        // Transfer funds to founder
        uint256 amount = milestone.fundingAmount;
        (bool success, ) = payable(round.founder).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(milestoneId, roundId, amount);
    }

    /**
     * @dev Withdraw investment if project fails or is cancelled
     * @param roundId The funding round ID
     */
    function withdrawInvestment(uint256 roundId) 
        external 
        validRound(roundId) 
        nonReentrant 
        whenNotPaused 
    {
        FundingRound storage round = fundingRounds[roundId];
        
        require(
            round.status == FundingStatus.Failed || 
            round.status == FundingStatus.Cancelled ||
            (round.status == FundingStatus.Active && block.timestamp > round.deadline),
            "Cannot withdraw at this time"
        );
        
        uint256 investment = round.investments[msg.sender];
        require(investment > 0, "No investment to withdraw");
        
        // Calculate withdrawable amount (considering any released funds)
        uint256 totalReleased = 0;
        uint256[] memory milestoneIds = roundMilestones[roundId];
        
        for (uint256 i = 0; i < milestoneIds.length; i++) {
            if (milestones[milestoneIds[i]].fundsReleased) {
                totalReleased += milestones[milestoneIds[i]].fundingAmount;
            }
        }
        
        uint256 withdrawableAmount = investment;
        if (totalReleased > 0) {
            withdrawableAmount = (investment * (round.targetAmount - totalReleased)) / round.targetAmount;
        }
        
        round.investments[msg.sender] = 0;
        
        // Transfer funds back to investor
        (bool success, ) = payable(msg.sender).call{value: withdrawableAmount}("");
        require(success, "Transfer failed");
        
        emit InvestmentWithdrawn(roundId, msg.sender, withdrawableAmount);
    }

    /**
     * @dev Emergency pause (owner only)
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Cancel a funding round (founder only)
     * @param roundId The funding round ID
     */
    function cancelFundingRound(uint256 roundId) 
        external 
        validRound(roundId) 
        onlyFounder(roundId) 
    {
        FundingRound storage round = fundingRounds[roundId];
        require(round.status == FundingStatus.Active, "Round not active");
        
        round.status = FundingStatus.Cancelled;
        
        emit FundingRoundCancelled(roundId);
    }

    // View functions
    function getFundingRound(uint256 roundId) 
        external 
        view 
        validRound(roundId) 
        returns (
            uint256 id,
            address founder,
            uint256 targetAmount,
            uint256 currentAmount,
            uint256 deadline,
            FundingStatus status,
            uint256 createdAt,
            uint256 milestonesCount
        ) 
    {
        FundingRound storage round = fundingRounds[roundId];
        return (
            round.id,
            round.founder,
            round.targetAmount,
            round.currentAmount,
            round.deadline,
            round.status,
            round.createdAt,
            round.milestonesCount
        );
    }

    function getRoundMilestones(uint256 roundId) 
        external 
        view 
        validRound(roundId) 
        returns (uint256[] memory) 
    {
        return roundMilestones[roundId];
    }

    function getInvestorRounds(address investor) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return investorRounds[investor];
    }

    function getInvestmentAmount(uint256 roundId, address investor) 
        external 
        view 
        validRound(roundId) 
        returns (uint256) 
    {
        return fundingRounds[roundId].investments[investor];
    }

    function isWhitelisted(uint256 roundId, address investor) 
        external 
        view 
        validRound(roundId) 
        returns (bool) 
    {
        return fundingRounds[roundId].whitelist[investor];
    }

    function getNextRoundId() external view returns (uint256) {
        return _nextRoundId;
    }

    function getNextMilestoneId() external view returns (uint256) {
        return _nextMilestoneId;
    }
} 