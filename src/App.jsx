import React, { useState } from 'react';
import axios from 'axios';

// --- 아이콘 컴포넌트들 (SVG) ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-3">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);


// --- 메인 앱 컴포넌트 ---
export default function App() {
  // --- 상태 관리 (State) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // --- 이벤트 핸들러 ---
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("검색할 업체명을 입력해주세요.");
      setResults([]);
      setHasSearched(true);
      return;
    }

    setResults([]);
    setError(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/companies/search/', {
        params: {
          name: searchTerm,
        },
      });

      if (response.data && response.data.length > 0 && response.data[0].오류) {
          setError(response.data[0].오류);
      } else {
          setResults(response.data);
      }

    } catch (err) {
      console.error("API 요청 에러:", err);
      setError("서버에 연결할 수 없거나 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // --- UI 렌더링 ---
  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="container mx-auto p-4 sm:p-8">
        
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-2">Bidding Partner</h1>
          <p className="text-lg text-slate-500">협력업체 검색 시스템</p>
        </header>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="검색할 업체명을 입력하세요..."
              className="block w-full pl-12 pr-3 py-4 text-lg border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center transition duration-150 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? <SpinnerIcon /> : '검색하기'}
          </button>
        </div>

        <main className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center" role="alert">
                <ErrorIcon />
                <div>
                    <p className="font-bold">오류 발생</p>
                    <p>{error}</p>
                </div>
            </div>
          )}

          {hasSearched && !isLoading && !error && results.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xl text-slate-500">검색 결과가 없습니다.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">업체명</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">사업자번호</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">지역</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">시공능력평가액</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {results.map((company, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{company['검색된 회사']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{company['사업자번호']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{company['지역']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{company['시평']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
