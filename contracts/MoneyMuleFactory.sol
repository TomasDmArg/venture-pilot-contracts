// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MoneyMuleRound.sol";

/**
 * @title MoneyMuleFactory
 * @dev Factory contract for creating and tracking funding rounds
 * @author MoneyMule Team
 */
contract MoneyMuleFactory is Ownable, Pausable, ReentrancyGuard {
    
    // State variables
    uint256 private _nextRoundId = 1;
    
    // Mappings
    mapping(uint256 => address) public rounds; // roundId => round contract address
    mapping(address => uint256[]) public founderRounds; // founder => roundIds
    mapping(address => uint256[]) public investorRounds; // investor => roundIds
    mapping(address => bool) public authorizedJurors; // Global jury whitelist
    
    // Events
    event RoundCreated(
        uint256 indexed roundId,
        address indexed roundContract,
        address indexed founder,
        address token,
        uint256 targetAmount
    );
    
    event JurorAuthorized(address indexed juror);
    event JurorRevoked(address indexed juror);
    
    // Structs
    struct MilestoneData {
        string description;
        uint256 fundingAmount;
        uint256 deadline;
        address[3] juryWallets;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new funding round
     * @param token The ERC20 token address for funding
     * @param targetAmount The total funding target
     * @param fundingDeadline The deadline for funding phase
     * @param milestones Array of milestone data
     */
    function createFundingRound(
        address token,
        uint256 targetAmount,
        uint256 fundingDeadline,
        MilestoneData[] calldata milestones
    ) external whenNotPaused nonReentrant returns (uint256 roundId, address roundContract) {
        require(token != address(0), "Invalid token address");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(fundingDeadline > block.timestamp, "Funding deadline must be in the future");
        require(milestones.length > 0, "At least one milestone required");
        
        // Validate milestones
        uint256 totalMilestoneFunding = 0;
        for (uint256 i = 0; i < milestones.length; i++) {
            require(milestones[i].deadline > fundingDeadline, "Milestone deadline must be after funding deadline");
            require(milestones[i].fundingAmount > 0, "Milestone funding must be greater than 0");
            totalMilestoneFunding += milestones[i].fundingAmount;
            
            // Validate jury wallets
            for (uint256 j = 0; j < 3; j++) {
                require(milestones[i].juryWallets[j] != address(0), "Invalid jury wallet");
                require(authorizedJurors[milestones[i].juryWallets[j]], "Jury wallet not authorized");
            }
        }
        
        require(totalMilestoneFunding == targetAmount, "Milestone funding must equal target amount");
        
        roundId = _nextRoundId++;
        
        // Deploy new round contract
        MoneyMuleRound newRound = new MoneyMuleRound(
            roundId,
            msg.sender, // founder
            token,
            targetAmount,
            fundingDeadline,
            milestones
        );
        
        roundContract = address(newRound);
        
        // Store round data
        rounds[roundId] = roundContract;
        founderRounds[msg.sender].push(roundId);
        
        emit RoundCreated(roundId, roundContract, msg.sender, token, targetAmount);
        
        return (roundId, roundContract);
    }
    
    /**
     * @dev Authorize a juror globally
     * @param juror The address to authorize as juror
     */
    function authorizeJuror(address juror) external onlyOwner {
        require(juror != address(0), "Invalid juror address");
        require(!authorizedJurors[juror], "Juror already authorized");
        
        authorizedJurors[juror] = true;
        emit JurorAuthorized(juror);
    }
    
    /**
     * @dev Revoke juror authorization
     * @param juror The address to revoke authorization from
     */
    function revokeJuror(address juror) external onlyOwner {
        require(authorizedJurors[juror], "Juror not authorized");
        
        authorizedJurors[juror] = false;
        emit JurorRevoked(juror);
    }
    
    /**
     * @dev Record investor participation in a round
     * @param investor The investor address
     * @param roundId The round ID
     */
    function recordInvestorParticipation(address investor, uint256 roundId) external {
        require(rounds[roundId] == msg.sender, "Only round contract can call this");
        
        // Check if investor is already recorded for this round
        uint256[] storage investorRoundsList = investorRounds[investor];
        for (uint256 i = 0; i < investorRoundsList.length; i++) {
            if (investorRoundsList[i] == roundId) {
                return; // Already recorded
            }
        }
        
        investorRounds[investor].push(roundId);
    }
    
    /**
     * @dev Emergency pause
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getNextRoundId() external view returns (uint256) {
        return _nextRoundId;
    }
    
    function getRoundContract(uint256 roundId) external view returns (address) {
        return rounds[roundId];
    }
    
    function getFounderRounds(address founder) external view returns (uint256[] memory) {
        return founderRounds[founder];
    }
    
    function getInvestorRounds(address investor) external view returns (uint256[] memory) {
        return investorRounds[investor];
    }
    
    function isAuthorizedJuror(address juror) external view returns (bool) {
        return authorizedJurors[juror];
    }
    
    function getTotalRounds() external view returns (uint256) {
        return _nextRoundId - 1;
    }
} 