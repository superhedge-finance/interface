import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LeaderboardUser {
  userId: string;
  xp: number;
  name: string;
  avatar: string;
  ethAddress: string;
  address: string;
  twitterUsername: string;
  discordHandle: string;
  numberOfQuests: number;
  email: string;
  connectedWallet: string;
}

interface LeaderboardResponse {
  data: LeaderboardUser[];
  totalPages: number;
  page: number;
  totalRecords: number;
  status: string;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `https://api-v2.zealy.io/public/communities/superhedgeseason1/leaderboard?page=${currentPage}&limit=${itemsPerPage}`,
          {
            method: 'GET',
            headers: {
              "x-api-key": "0b37148oDvafvQ7A9yYhyULK4_5"
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }

        const data: LeaderboardResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          setError('No leaderboard data available');
          return;
        }

        setLeaderboardData(data.data.slice(0, itemsPerPage));
        setTotalPages(Math.ceil(data.totalRecords / itemsPerPage));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Address</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboardData.map((user, index) => (
              <tr key={user.userId} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  #{(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.address}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.xp.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 text-sm rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            if (totalPages <= 3) return true;
            if (page === 1) return true;
            if (page === totalPages) return true;
            return Math.abs(currentPage - page) <= 1;
          })
          .map((page, index, array) => (
            <>
              {index > 0 && array[index - 1] !== page - 1 && (
                <span className="px-4 py-2">...</span>
              )}
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            </>
          ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 text-sm rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
