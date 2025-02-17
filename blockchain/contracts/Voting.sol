// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate{
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }

    struct Voter{
        bool hasVoted;
        uint256 candidateId;
        bool isRegistered;
    }

    uint256 public candidatesCount;
    address public admin;
    bool public votingStarted;
    bool public votingEnded;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;

    event VoterRegistered(address voter);
    event CandidateRegistered(uint256 id, string name, string party);
    event Voted(address voter, uint256 candidateId);
    event VotingStarted();
    event VotingEnded();

    modifier onlyAdmin(){   //kinda like a middleware
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier votingOngoing() {
        require(votingStarted && !votingEnded, "Voting is not ongoing");
        _;
    }

    modifier votingNotBegin() {
        require(!votingStarted, "Voting has already started");
        _;
    }

    constructor(){
        admin = msg.sender;
        votingStarted = false;
        votingEnded = false;
    }

    function registerVoter(address _voter) public onlyAdmin votingNotBegin{
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter].isRegistered = true;
        emit VoterRegistered(_voter);
    }

    function registerCandidate(string memory _name, string memory _party) public onlyAdmin votingNotBegin{
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, 0);
        emit CandidateRegistered(candidatesCount, _name, _party);
    }

    function startVoting() public onlyAdmin votingNotBegin{
        require(candidatesCount > 0, "No candidates registered");
        votingStarted = true;
        emit VotingStarted();
    }

    function vote(uint256 _candidateId) public votingOngoing{
        require(voters[msg.sender].isRegistered, "Voter not registered");
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate id");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].candidateId = _candidateId;
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }

    function endVoting() public onlyAdmin votingOngoing{
        votingEnded = true;
        emit VotingEnded();
    }

    function getWinner() public view returns (string memory, string memory, uint256){
        require(votingEnded, "Voting has not ended");

        uint256 maxVoteCount = 0;
        uint256 winnerId = 0;
        for(uint256 i = 1; i <= candidatesCount; i++){
            if(candidates[i].voteCount > maxVoteCount){
                maxVoteCount = candidates[i].voteCount;
                winnerId = i;
            }
        }

        return (candidates[winnerId].name, candidates[winnerId].party, candidates[winnerId].voteCount);
    }

    function getVoter(address _voter) public view returns (bool, uint256, bool){
        return (voters[_voter].hasVoted, voters[_voter].candidateId, voters[_voter].isRegistered);
    }

    function getCandidate(uint256 _candidateId) public view returns (string memory, string memory, uint256){
        return (candidates[_candidateId].name, candidates[_candidateId].party, candidates[_candidateId].voteCount);
    }
}

