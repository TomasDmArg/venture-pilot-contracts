// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MoneyMuleFactory.sol";

/**
 * @title MoneyMuleRound
 * @dev Individual funding round contract with jury voting system
 * @author MoneyMule Team
 */
contract MoneyMuleRound is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Enums
    enum RoundPhase { Funding, Execution, Completed, Cancelled }
    enum MilestoneStatus { Pending, Active, Approved, Rejected, Completed }
    
    // Structs
    struct Milestone {
        uint256 id;
        string description;
        uint256 fundingAmount;
        uint256 deadline;
        address[3] juryWallets;
        MilestoneStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votingStartTime;
        uint256 completedAt;
        bool fundsReleased;
        mapping(address => bool) hasVoted;
    }
    
    // State variables
    MoneyMuleFactory public factory;
    uint256 public roundId;
    address public founder;
    address public token;
    uint256 public targetAmount;
    uint256 public currentAmount;
    uint256 public fundingDeadline;
    RoundPhase public phase;
    uint256 public createdAt;
    uint256 public milestonesCount;
    
    // Mappings
    mapping(uint256 => Milestone) public milestones;
    mapping(address => uint256) public investments;
    mapping(address => bool) public whitelist;
    
    // Constants
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant VERIFICATION_DELAY = 24 hours;
    
    // Events
    event InvestorWhitelisted(address indexed investor);
    event InvestmentMade(address indexed investor, uint256 amount);
    event PhaseChanged(RoundPhase newPhase);
    event MilestoneDeadlineTriggered(uint256 indexed milestoneId, address indexed triggeredBy);
    event JuryVoteCast(uint256 indexed milestoneId, address indexed juror, bool approve);
    event MilestoneVotingFinalized(uint256 indexed milestoneId, MilestoneStatus result);
    event MilestoneCompleted(uint256 indexed milestoneId);
    event FundsReleased(uint256 indexed milestoneId, uint256 amount);
    event InvestmentWithdrawn(address indexed investor, uint256 amount);
    event RoundCancelled();
    
    // Modifiers
    modifier onlyFounder() {
        require(msg.sender == founder, "Not the founder");
        _;
    }
    
    modifier onlyInFundingPhase() {
        require(phase == RoundPhase.Funding, "Not in funding phase");
        _;
    }
    
    modifier onlyInExecutionPhase() {
        require(phase == RoundPhase.Execution, "Not in execution phase");
        _;
    }
    
    modifier validMilestone(uint256 milestoneId) {
        require(milestoneId > 0 && milestoneId <= milestonesCount, "Invalid milestone ID");
        _;
    }
    
    modifier onlyAuthorizedJuror(uint256 milestoneId) {
        require(milestoneId > 0 && milestoneId <= milestonesCount, "Invalid milestone ID");
        Milestone storage milestone = milestones[milestoneId];
        
        bool isAuthorized = false;
        for (uint256 i = 0; i < 3; i++) {
            if (milestone.juryWallets[i] == msg.sender) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "Not authorized juror for this milestone");
        _;
    }
    
    constructor(
        uint256 _roundId,
        address _founder,
        address _token,
        uint256 _targetAmount,
        uint256 _fundingDeadline,
        MoneyMuleFactory.MilestoneData[] memory _milestones
    ) {
        factory = MoneyMuleFactory(msg.sender);
        roundId = _roundId;
        founder = _founder;
        token = _token;
        targetAmount = _targetAmount;
        fundingDeadline = _fundingDeadline;
        phase = RoundPhase.Funding;
        createdAt = block.timestamp;
        milestonesCount = _milestones.length;
        
        // Initialize milestones
        for (uint256 i = 0; i < _milestones.length; i++) {
            uint256 milestoneId = i + 1;
            Milestone storage milestone = milestones[milestoneId];
            
            milestone.id = milestoneId;
            milestone.description = _milestones[i].description;
            milestone.fundingAmount = _milestones[i].fundingAmount;
            milestone.deadline = _milestones[i].deadline;
            milestone.juryWallets = _milestones[i].juryWallets;
            milestone.status = MilestoneStatus.Pending;
        }
    }
    
    /**
     * @dev Whitelist an investor (founder only, funding phase only)
     * @param investor The investor address to whitelist
     */
    function whitelistInvestor(address investor) external onlyFounder onlyInFundingPhase {
        require(investor != address(0), "Invalid investor address");
        require(investor != founder, "Founder cannot be whitelisted as investor");
        require(!whitelist[investor], "Already whitelisted");
        
        whitelist[investor] = true;
        emit InvestorWhitelisted(investor);
    }
    
    /**
     * @dev Invest in the funding round (funding phase only)
     * @param amount The amount to invest
     */
    function invest(uint256 amount) external onlyInFundingPhase nonReentrant {
        require(whitelist[msg.sender], "Not whitelisted");
        require(block.timestamp <= fundingDeadline, "Funding deadline passed");
        require(amount > 0, "Investment amount must be greater than 0");
        require(currentAmount + amount <= targetAmount, "Exceeds target amount");
        
        // Transfer tokens from investor to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Record investment
        if (investments[msg.sender] == 0) {
            factory.recordInvestorParticipation(msg.sender, roundId);
        }
        
        investments[msg.sender] += amount;
        currentAmount += amount;
        
        // Move to execution phase if fully funded
        if (currentAmount == targetAmount) {
            phase = RoundPhase.Execution;
            emit PhaseChanged(RoundPhase.Execution);
        }
        
        emit InvestmentMade(msg.sender, amount);
    }
    
    /**
     * @dev Force move to execution phase after funding deadline (if partially funded)
     */
    function moveToExecutionPhase() external {
        require(phase == RoundPhase.Funding, "Not in funding phase");
        require(block.timestamp > fundingDeadline, "Funding deadline not reached");
        require(currentAmount > 0, "No funds raised");
        
        phase = RoundPhase.Execution;
        emit PhaseChanged(RoundPhase.Execution);
    }
    
    /**
     * @dev Trigger milestone deadline and start voting process (anyone can call)
     * @param milestoneId The milestone ID to trigger
     */
    function triggerMilestoneDeadline(uint256 milestoneId) external validMilestone(milestoneId) onlyInExecutionPhase {
        Milestone storage milestone = milestones[milestoneId];
        
        require(milestone.status == MilestoneStatus.Pending, "Milestone not pending");
        require(block.timestamp >= milestone.deadline, "Deadline not reached");
        
        // Start voting process
        milestone.status = MilestoneStatus.Active;
        milestone.votingStartTime = block.timestamp;
        
        emit MilestoneDeadlineTriggered(milestoneId, msg.sender);
    }
    
    /**
     * @dev Cast jury vote on milestone (only authorized jurors)
     * @param milestoneId The milestone ID to vote on
     * @param approve True to approve, false to reject
     */
    function castJuryVote(uint256 milestoneId, bool approve) external onlyAuthorizedJuror(milestoneId) {
        Milestone storage milestone = milestones[milestoneId];
        
        require(milestone.status == MilestoneStatus.Active, "Milestone not active for voting");
        require(block.timestamp <= milestone.votingStartTime + VOTING_PERIOD, "Voting period ended");
        require(!milestone.hasVoted[msg.sender], "Already voted");
        
        milestone.hasVoted[msg.sender] = true;
        
        if (approve) {
            milestone.votesFor++;
        } else {
            milestone.votesAgainst++;
        }
        
        emit JuryVoteCast(milestoneId, msg.sender, approve);
        
        // Auto-finalize if all jurors voted
        if (milestone.votesFor + milestone.votesAgainst == 3) {
            _finalizeMilestoneVoting(milestoneId);
        }
    }
    
    /**
     * @dev Finalize milestone voting (anyone can call after voting period)
     * @param milestoneId The milestone ID to finalize
     */
    function finalizeMilestoneVoting(uint256 milestoneId) external validMilestone(milestoneId) {
        Milestone storage milestone = milestones[milestoneId];
        
        require(milestone.status == MilestoneStatus.Active, "Milestone not active for voting");
        require(block.timestamp > milestone.votingStartTime + VOTING_PERIOD, "Voting period not ended");
        
        _finalizeMilestoneVoting(milestoneId);
    }
    
    /**
     * @dev Internal function to finalize milestone voting
     * @param milestoneId The milestone ID to finalize
     */
    function _finalizeMilestoneVoting(uint256 milestoneId) internal {
        Milestone storage milestone = milestones[milestoneId];
        
        if (milestone.votesFor > milestone.votesAgainst) {
            milestone.status = MilestoneStatus.Approved;
        } else {
            milestone.status = MilestoneStatus.Rejected;
        }
        
        emit MilestoneVotingFinalized(milestoneId, milestone.status);
    }
    
    /**
     * @dev Complete milestone after approval (founder only)
     * @param milestoneId The milestone ID to complete
     */
    function completeMilestone(uint256 milestoneId) external onlyFounder validMilestone(milestoneId) {
        Milestone storage milestone = milestones[milestoneId];
        
        require(milestone.status == MilestoneStatus.Approved, "Milestone not approved");
        
        milestone.status = MilestoneStatus.Completed;
        milestone.completedAt = block.timestamp;
        
        emit MilestoneCompleted(milestoneId);
    }
    
    /**
     * @dev Release funds for completed milestone (founder only, after verification delay)
     * @param milestoneId The milestone ID to release funds for
     */
    function releaseFunds(uint256 milestoneId) external onlyFounder validMilestone(milestoneId) nonReentrant {
        Milestone storage milestone = milestones[milestoneId];
        
        require(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
        require(!milestone.fundsReleased, "Funds already released");
        require(
            block.timestamp >= milestone.completedAt + VERIFICATION_DELAY,
            "Verification delay not met"
        );
        
        milestone.fundsReleased = true;
        
        // Calculate release amount based on current funding
        uint256 releaseAmount = (milestone.fundingAmount * currentAmount) / targetAmount;
        
        // Transfer tokens to founder
        IERC20(token).safeTransfer(founder, releaseAmount);
        
        emit FundsReleased(milestoneId, releaseAmount);
    }
    
    /**
     * @dev Withdraw investment (various conditions)
     * @param amount Amount to withdraw (0 for all available)
     */
    function withdrawInvestment(uint256 amount) external nonReentrant {
        uint256 investment = investments[msg.sender];
        require(investment > 0, "No investment to withdraw");
        
        uint256 withdrawableAmount = _calculateWithdrawableAmount(msg.sender);
        require(withdrawableAmount > 0, "No amount available for withdrawal");
        
        uint256 withdrawAmount = amount;
        if (withdrawAmount == 0 || withdrawAmount > withdrawableAmount) {
            withdrawAmount = withdrawableAmount;
        }
        
        // Update investment record
        uint256 proportionalReduction = (withdrawAmount * investment) / withdrawableAmount;
        investments[msg.sender] -= proportionalReduction;
        
        // Transfer tokens back to investor
        IERC20(token).safeTransfer(msg.sender, withdrawAmount);
        
        emit InvestmentWithdrawn(msg.sender, withdrawAmount);
    }
    
    /**
     * @dev Calculate withdrawable amount for an investor
     * @param investor The investor address
     */
    function _calculateWithdrawableAmount(address investor) internal view returns (uint256) {
        uint256 investment = investments[investor];
        if (investment == 0) return 0;
        
        // Can withdraw in various scenarios
        if (phase == RoundPhase.Cancelled) {
            // If cancelled, calculate based on unreleased funds
            uint256 totalReleased = 0;
            for (uint256 i = 1; i <= milestonesCount; i++) {
                if (milestones[i].fundsReleased) {
                    totalReleased += milestones[i].fundingAmount;
                }
            }
            
            uint256 proportionalReleased = (totalReleased * currentAmount) / targetAmount;
            uint256 remainingInContract = currentAmount - proportionalReleased;
            
            return (investment * remainingInContract) / currentAmount;
        }
        
        if (phase == RoundPhase.Funding && block.timestamp > fundingDeadline) {
            return investment; // Full refund if funding failed
        }
        
        if (phase == RoundPhase.Execution || phase == RoundPhase.Completed) {
            // Calculate based on unreleased funds
            uint256 totalReleased = 0;
            for (uint256 i = 1; i <= milestonesCount; i++) {
                if (milestones[i].fundsReleased) {
                    totalReleased += milestones[i].fundingAmount;
                }
            }
            
            uint256 proportionalReleased = (totalReleased * currentAmount) / targetAmount;
            uint256 remainingInContract = currentAmount - proportionalReleased;
            
            return (investment * remainingInContract) / currentAmount;
        }
        
        return 0;
    }
    
    /**
     * @dev Cancel the round (founder only)
     */
    function cancelRound() external onlyFounder {
        require(phase != RoundPhase.Completed, "Cannot cancel completed round");
        
        phase = RoundPhase.Cancelled;
        emit RoundCancelled();
        emit PhaseChanged(RoundPhase.Cancelled);
    }
    
    // View functions
    function getMilestone(uint256 milestoneId) external view validMilestone(milestoneId) returns (
        uint256 id,
        string memory description,
        uint256 fundingAmount,
        uint256 deadline,
        address[3] memory juryWallets,
        MilestoneStatus status,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votingStartTime,
        uint256 completedAt,
        bool fundsReleased
    ) {
        Milestone storage milestone = milestones[milestoneId];
        return (
            milestone.id,
            milestone.description,
            milestone.fundingAmount,
            milestone.deadline,
            milestone.juryWallets,
            milestone.status,
            milestone.votesFor,
            milestone.votesAgainst,
            milestone.votingStartTime,
            milestone.completedAt,
            milestone.fundsReleased
        );
    }
    
    function hasJurorVoted(uint256 milestoneId, address juror) external view validMilestone(milestoneId) returns (bool) {
        return milestones[milestoneId].hasVoted[juror];
    }
    
    function getInvestmentAmount(address investor) external view returns (uint256) {
        return investments[investor];
    }
    
    function isWhitelisted(address investor) external view returns (bool) {
        return whitelist[investor];
    }
    
    function getWithdrawableAmount(address investor) external view returns (uint256) {
        return _calculateWithdrawableAmount(investor);
    }
    
    function getRoundInfo() external view returns (
        uint256 id,
        address founderAddr,
        address tokenAddr,
        uint256 target,
        uint256 current,
        uint256 deadline,
        RoundPhase currentPhase,
        uint256 created,
        uint256 totalMilestones
    ) {
        return (
            roundId,
            founder,
            token,
            targetAmount,
            currentAmount,
            fundingDeadline,
            phase,
            createdAt,
            milestonesCount
        );
    }
} 