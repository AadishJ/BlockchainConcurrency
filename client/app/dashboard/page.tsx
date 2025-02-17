"use client"

import { useState, useEffect } from "react";
import { ethers, JsonRpcProvider } from "ethers";
import VotingArtifact from "../../public/Voting.json";

interface Candidate {
  id: number;
  name: string;
  party: string;
  voteCount: number;
}

export default function Dashboard() {
  const [contract, setContract] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [votingStarted, setVotingStarted] = useState<boolean>(false);
  const [votingEnded, setVotingEnded] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [newVoter, setNewVoter] = useState<string>("");
  const [isRegisteredVoter, setIsRegisteredVoter] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [votedFor, setVotedFor] = useState<number>(0);
  const [newCandidate, setNewCandidate] = useState({ name: "", party: "" });

  const contractAddress = "0xe5AEc5eeBEe7F8eC5FE4c254F17edd3939828c9C";
  const contractABI = VotingArtifact.abi;

  const refreshVoterStatus = async (votingContract: any, address: string) => {
    try {
      const voter = await votingContract.voters(address);
      setIsRegisteredVoter(voter.isRegistered);
      setHasVoted(voter.hasVoted);
      setVotedFor(Number(voter.candidateId));
    } catch (error) {
      console.error("Error fetching voter status:", error);
    }
  };

  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        const provider = new JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await provider.getSigner(0);
        const address = await signer.getAddress();
        setUserAddress(address);

        const votingContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(votingContract);

        const admin = await votingContract.admin();
        setIsAdmin(admin.toLowerCase() === address.toLowerCase());

        setVotingStarted(await votingContract.votingStarted());
        setVotingEnded(await votingContract.votingEnded());

        await refreshVoterStatus(votingContract, address);
        await refreshCandidates(votingContract);
      } catch (error) {
        console.error("Error connecting to blockchain:", error);
      }
    };

    loadBlockchainData();
  }, []);

  const refreshCandidates = async (contractInstance: any) => {
    try {
      const count = await contractInstance.candidatesCount();
      const candidateList: Candidate[] = [];

      for (let i = 1; i <= Number(count); i++) {
        const candidate = await contractInstance.candidates(i);
        candidateList.push({
          id: i,
          name: candidate.name,
          party: candidate.party,
          voteCount: Number(candidate.voteCount)
        });
      }

      setCandidates(candidateList);
    } catch (error) {
      console.error("Error refreshing candidates:", error);
    }
  };

  const registerVoter = async () => {
    try {
      const tx = await contract.registerVoter(newVoter);
      await tx.wait();
      setNewVoter("");
      alert("Voter registered successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const addCandidate = async () => {
    try {
      const tx = await contract.registerCandidate(newCandidate.name, newCandidate.party);
      await tx.wait();
      setNewCandidate({ name: "", party: "" });
      await refreshCandidates(contract);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const startVoting = async () => {
    try {
      const tx = await contract.startVoting();
      await tx.wait();
      setVotingStarted(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const endVoting = async () => {
    try {
      const tx = await contract.endVoting();
      await tx.wait();
      setVotingEnded(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const castVote = async (candidateId: number) => {
    try {
      const tx = await contract.vote(candidateId);
      await tx.wait();
      setHasVoted(true);
      setVotedFor(candidateId);
      await refreshCandidates(contract);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voting Dashboard</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-600">Connected as: {userAddress}</p>
          <p className="text-gray-600">
            Role: {isAdmin ? "Admin" : isRegisteredVoter ? "Registered Voter" : "Unregistered"}
          </p>
          <p className="text-gray-600">
            Status: {!votingStarted ? "Not Started" : votingEnded ? "Ended" : "Ongoing"}
          </p>
        </div>

        {isAdmin && !votingEnded && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>

            <div className="mb-6">
              <h3 className="text-lg mb-2">Register Voter</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newVoter}
                  onChange={(e) => setNewVoter(e.target.value)}
                  placeholder="Voter Address"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={registerVoter}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={votingStarted}
                >
                  Register
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg mb-2">Add Candidate</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  placeholder="Candidate Name"
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="text"
                  value={newCandidate.party}
                  onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                  placeholder="Party Name"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={addCandidate}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  disabled={votingStarted}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startVoting}
                className="bg-purple-500 text-white px-6 py-2 rounded"
                disabled={votingStarted}
              >
                Start Voting
              </button>
              <button
                onClick={endVoting}
                className="bg-red-500 text-white px-6 py-2 rounded"
                disabled={!votingStarted || votingEnded}
              >
                End Voting
              </button>
            </div>
          </div>
        )}

        {isRegisteredVoter && votingStarted && !votingEnded && !hasVoted && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
            <div className="grid grid-cols-1 gap-4">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => castVote(candidate.id)}
                  className="border p-4 rounded-lg text-left hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-semibold">{candidate.name}</h3>
                  <p className="text-gray-600">{candidate.party}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasVoted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">
              You have voted for: {candidates.find(c => c.id === votedFor)?.name}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {votingEnded ? "Final Results" : "Current Standings"}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {candidates
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`border p-4 rounded-lg ${votingEnded && index === 0 ? 'bg-yellow-50 border-yellow-200' : ''
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{candidate.name}</h3>
                      <p className="text-gray-600">{candidate.party}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{candidate.voteCount} votes</p>
                      {votingEnded && index === 0 && (
                        <p className="text-yellow-600">Winner</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}