// src/App.jsx

import React, { useState, useEffect,  useRef} from 'react';
import axios from 'axios';

// --- (헬퍼 함수, DISPLAY_ORDER 등은 이전과 동일) ---
const formatNumber = (value) => { if (!value && value !== 0) return ''; const num = String(value).replace(/,/g, ''); return isNaN(num) ? String(value) : Number(num).toLocaleString(); };
const unformatNumber = (value) => String(value).replace(/,/g, '');
const DISPLAY_ORDER = [ "검색된 회사", "대표자", "사업자번호", "지역", "시평", "3년 실적", "5년 실적", "부채비율", "유동비율", "영업기간", "신용평가", "여성기업", "고용자수", "일자리창출", "품질평가", "비고" ];
const getStatusClass = (statusText) => { if (statusText === '최신') return 'status-latest'; if (statusText === '1년 경과') return 'status-warning'; if (statusText === '1년 이상 경과') return 'status-old'; return 'status-unknown'; };
const formatPercentage = (value) => {
  if (!value && value !== 0) return '';
  const num = Number(String(value).replace(/,/g, ''));
  if (isNaN(num)) return String(value); // 숫자가 아니면 그대로 반환
  
  // 소수점 둘째 자리까지 반올림하고 '%' 기호를 붙입니다.
  return num.toFixed(2) + '%';
};
const refreshFileStatuses = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/check_files/');
      setFileStatuses(response.data);
    } catch (err) {
      console.error("파일 상태 확인 실패:", err);
    }
  };

// 복사 완료 팝업창(다이어로그) 컴포넌트
function CopyDialog({ isOpen, message, onClose }) {
  // 1. '확인' 버튼을 가리킬 ref를 생성합니다.
  const buttonRef = useRef(null);

  // 2. 팝업창이 열릴 때 버튼에 자동으로 포커스를 주는 기능
  useEffect(() => {
    if (isOpen) {
      // 팝업이 나타나면 바로 확인 버튼에 포커스를 줍니다.
      buttonRef.current?.focus();
    }
  }, [isOpen]);

  // 3. 엔터 키를 감지하는 기능 (개선)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isOpen && event.key === 'Enter') {
        // 이벤트가 다른 곳(예: 검색창)으로 전달되는 것을 막습니다.
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <p>{message}</p>
        {/* 4. 버튼에 ref를 연결합니다. */}
        <button ref={buttonRef} onClick={onClose}>확인</button>
      </div>
    </div>
  );
}



// 개별 파일 업로드를 처리하는 작은 컴포넌트
function FileUploader({ type, label, isUploaded, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 선택해주세요.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      setMessage('업로드 중...');
      console.log("--- [1] 파일 업로드를 시작합니다. ---");
      const response = await axios.post('http://127.0.0.1:8000/api/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log("--- [2] 업로드 성공! 서버 응답:", response);
      setMessage(response.data.message);

      console.log("--- [3] 파일 상태 새로고침 함수(onUploadSuccess)를 호출합니다. ---");
      
      // --- ▼▼▼ 업로드 성공 후, 부모의 상태 새로고침 함수를 호출합니다! ▼▼▼ ---
      if (onUploadSuccess) {
        onUploadSuccess();
        console.log("--- [4] 새로고침 함수 호출 완료. ---");
      }

    } catch (err) {
      console.error("!!! 업로드 과정 중 에러 발생:", err);
      setMessage('업로드 실패. 서버를 확인해주세요.');
      
      console.error(err);
    }
  };

  return (
    <div className="file-uploader">
      <label>{label} 엑셀 파일</label>
      {isUploaded ? (
        <p className="upload-message success">
          ✅ 서버에 파일이 업로드되어 있습니다.
        </p>
      ) : (
        <p className="upload-message warning">
          ⚠️ 파일이 없습니다. 업로드해주세요.
        </p>
      )}

      <div className="uploader-controls">
        <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
        <button onClick={handleUpload}>업로드</button>
      </div>
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
}



// 부모로부터 fileStatuses를 props로 받습니다.
function AdminUpload({ fileStatuses, onUploadSuccess }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`admin-upload-section ${isOpen ? 'is-open' : ''}`}>
      <div className="admin-header" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="sub-title">관리자 파일 업로드</h2>
        <span className="toggle-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      <div className="uploaders-grid">
        {/* --- ▼▼▼ onUploadSuccess를 자식에게 전달합니다 ▼▼▼ --- */}
        <FileUploader type="eung" label="전기" isUploaded={fileStatuses.eung} onUploadSuccess={onUploadSuccess} />
        <FileUploader type="tongsin" label="통신" isUploaded={fileStatuses.tongsin} onUploadSuccess={onUploadSuccess} />
        <FileUploader type="sobang" label="소방" isUploaded={fileStatuses.sobang} onUploadSuccess={onUploadSuccess} />
      </div>
    </div>
  );
}




function App() {
  const [filters, setFilters] = useState({ name: '', region: '전체', manager: '', min_sipyung: '', max_sipyung: '', min_3y: '', max_3y: '', min_5y: '', max_5y: '' });
  const [regions, setRegions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState('eung'); // 기본값 'eung' (전기)
  const [dialog, setDialog] = useState({ isOpen: false, message: '' });
  const [fileStatuses, setFileStatuses] = useState({
    eung: false,
    tongsin: false,
    sobang: false,
  });

   const refreshFileStatuses  = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/check_files/');
        setFileStatuses(response.data);
      } catch (err) {
        console.error("파일 상태 확인 실패:", err);
      }
    };


  useEffect(() => {
    
    // 2. 지역(시트) 목록을 가져오는 함수
    const fetchRegions = async () => {
      try {
        // 선택된 fileType을 파라미터로 함께 보냅니다.
        const response = await axios.get(`http://127.0.0.1:8000/api/get_regions/?file_type=${fileType}`);
        setRegions(response.data);
      } catch (err) {
        console.error("지역 목록을 불러오는 데 실패했습니다.", err);
        setRegions([]); // 에러 발생 시 목록을 비웁니다.
      }
    };

    refreshFileStatuses();
    fetchRegions();
  }, [fileType]); // ✨ fileType이 변경될 때마다 이 함수가 다시 실행됩니다.

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const numberFields = ['min_sipyung', 'max_sipyung', 'min_3y', 'max_3y', 'min_5y', 'max_5y'];
    if (numberFields.includes(name)) { setFilters(prev => ({ ...prev, [name]: formatNumber(value) })); } else { setFilters(prev => ({ ...prev, [name]: value })); }
  };

const handleSearch = async () => {
    setSearchPerformed(true);
    setIsLoading(true);
    setSelectedCompany(null);
    setSearchResults([]);
    setError('');

    try {
      // 1. API로 보낼 파라미터 객체를 새로 만듭니다.
      const paramsToSend = { ...filters };

      // 2. 숫자 필드에서 쉼표를 제거합니다.
      for (const key in paramsToSend) {
        if (['min_sipyung', 'max_sipyung', 'min_3y', 'max_3y', 'min_5y', 'max_5y'].includes(key)) {
          paramsToSend[key] = unformatNumber(paramsToSend[key]);
        }
      }
      
      // 3. 사용자가 선택한 파일 타입을 파라미터에 추가합니다.
      paramsToSend.file_type = fileType;

      // 4. URL 파라미터로 변환하여 API를 호출합니다.
      const params = new URLSearchParams(paramsToSend).toString();
      const response = await axios.get(`http://127.0.0.1:8000/api/search/?${params}`);
      
      setSearchResults(response.data);

    } catch (err) {
      setError('업체 검색 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  

    const handleCompanySelect = (company) => { setSelectedCompany(company); };
    const handleKeyDown = (event) => {
    // 만약 눌린 키가 'Enter' 라면, 검색 함수를 실행합니다.
    if (event.key === 'Enter') {
      handleSearch();
    }
    // 문제가 되었던 불필요한 코드를 삭제했습니다.
  };

  const handleCopySingle = (key, value) => {
    navigator.clipboard.writeText(String(value));
    setDialog({ isOpen: true, message: `'${key}' 항목이 복사되었습니다.` });
  };

  // 전체 정보 복사 함수
  const handleCopyAll = () => {
    if (!selectedCompany) return;

    const textToCopy = DISPLAY_ORDER.map(key => {
      const value = selectedCompany[key] ?? '';
      const formattedKeys = ['시평', '3년 실적', '5년 실적'];
      return formattedKeys.includes(key) ? formatNumber(value) : String(value);
    }).join('\n');

    navigator.clipboard.writeText(textToCopy);
    setDialog({ isOpen: true, message: '전체 정보가 클립보드에 복사되었습니다!' });
  };

return (
    <div className="app-container">
      <h1 className="main-title">업체 검색 및 적격 심사</h1>

      {/* 관리자 업로드 섹션 (접이식) */}
      <AdminUpload 
        fileStatuses={fileStatuses} 
        onUploadSuccess={refreshFileStatuses} 
      />

      {/* --- ▼▼▼ '검색 대상 선택'과 '필터'를 하나의 카드로 통합합니다 ▼▼▼ --- */}
      <div className="filter-section">
        {/* 검색 대상 선택 */}
        <div className="file-type-selector">
          <h3>검색 대상</h3>
          <div className="radio-group">
            <label>
              <input type="radio" value="eung" checked={fileType === 'eung'} onChange={(e) => setFileType(e.target.value)} />
              전기
            </label>
            <label>
              <input type="radio" value="tongsin" checked={fileType === 'tongsin'} onChange={(e) => setFileType(e.target.value)} />
              통신
            </label>
            <label>
              <input type="radio" value="sobang" checked={fileType === 'sobang'} onChange={(e) => setFileType(e.target.value)} />
              소방
            </label>
          </div>
        </div>

        {/* 필터 그리드 */}
        <div className="filter-grid">
          <div className="filter-item">
            <label>업체명</label>
            <input type="text" name="name" value={filters.name} onChange={handleFilterChange} onKeyDown={handleKeyDown} className="filter-input" />
          </div>
          <div className="filter-item">
            <label>지역</label>
            <select name="region" value={filters.region} onChange={handleFilterChange} className="filter-input">
              <option value="전체">전체</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>담당자</label>
            <input type="text" name="manager" value={filters.manager} onChange={handleFilterChange} className="filter-input" />
          </div>
          <div className="filter-item range">
            <label>시평액 범위</label>
            <div className="range-inputs">
              <input type="text" name="min_sipyung" value={filters.min_sipyung} onChange={handleFilterChange} placeholder="최소" className="filter-input" />
              <span>~</span>
              <input type="text" name="max_sipyung" value={filters.max_sipyung} onChange={handleFilterChange} placeholder="최대" className="filter-input" />
            </div>
          </div>
          <div className="filter-item range">
            <label>3년 실적 범위</label>
            <div className="range-inputs">
              <input type="text" name="min_3y" value={filters.min_3y} onChange={handleFilterChange} placeholder="최소" className="filter-input" />
              <span>~</span>
              <input type="text" name="max_3y" value={filters.max_3y} onChange={handleFilterChange} placeholder="최대" className="filter-input" />
            </div>
          </div>
          <div className="filter-item range">
            <label>5년 실적 범위</label>
            <div className="range-inputs">
              <input type="text" name="min_5y" value={filters.min_5y} onChange={handleFilterChange} placeholder="최소" className="filter-input" />
              <span>~</span>
              <input type="text" name="max_5y" value={filters.max_5y} onChange={handleFilterChange} placeholder="최대" className="filter-input" />
            </div>
          </div>
          <div className="filter-item">
            {/* 검색 버튼을 필터 그리드 마지막에 배치하여 정렬을 맞춥니다. */}
            <label>&nbsp;</label> {/* 높이를 맞추기 위한 빈 레이블 */}
            <button onClick={handleSearch} className="search-button" disabled={isLoading}>
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      </div>
      
      {error && <p className="error-message">{error}</p>}

      {searchPerformed && (
        <div className="results-layout">
          <div className="search-results-list">
            <h2 className="sub-title">검색 결과</h2>
            {isLoading && <p>로딩 중...</p>}
            {!isLoading && searchResults.length === 0 && <p>검색 결과가 없습니다.</p>}
            <ul>
              {searchResults.map((company, index) => {
                const isActive = selectedCompany && selectedCompany.사업자번호 === company.사업자번호;
                const summaryStatus = company['요약상태'] || '미지정';
                return (
                  <li key={index} onClick={() => handleCompanySelect(company)} className={`company-list-item ${isActive ? 'active' : ''}`}>
                    <span className="company-name">{company['업체명']}</span>
                    <span className={`summary-status-badge ${getStatusClass(summaryStatus)}`}>
                      {summaryStatus}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="company-details">
            <div className="details-header">
              <h2 className="sub-title">업체 상세 정보</h2>
              {selectedCompany && (
                <button onClick={handleCopyAll} className="copy-all-button">
                  전체 복사
                </button>
              )}
            </div>
            {selectedCompany ? (
              <div className="table-container">
                <table className="details-table">
                  <tbody>
                    {DISPLAY_ORDER.map((key) => {
                      const value = selectedCompany[key] ?? 'N/A';
                      const status = selectedCompany.데이터상태?.[key] ? selectedCompany.데이터상태[key] : '미지정';
                      let displayValue;
                      const percentageKeys = ['부채비율', '유동비율'];
                      const formattedKeys = ['시평', '3년 실적', '5년 실적'];
                      if (percentageKeys.includes(key)) {
                        displayValue = formatPercentage(value);
                      } else if (formattedKeys.includes(key)) {
                        displayValue = formatNumber(value);
                      } else {
                        displayValue = String(value);
                      }
                      return (
                        <tr key={key}>
                          <th>{key}</th>
                          <td>
                            <div className="value-cell">
                              <div className="value-with-status">
                                <span className={`status-dot ${getStatusClass(status)}`} title={status}></span>
                                <span>{displayValue}</span>
                              </div>
                              <button onClick={() => handleCopySingle(key, displayValue)} className="copy-single-button" title={`${key} 복사`}>
                                복사
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (<p>왼쪽 목록에서 업체를 선택하세요.</p>)}
          </div>
        </div>
      )}

      <CopyDialog 
        isOpen={dialog.isOpen} 
        message={dialog.message} 
        onClose={() => setDialog({ isOpen: false, message: '' })} 
      />
    </div>
  );
}

export default App;