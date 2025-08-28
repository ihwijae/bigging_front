  // src/App.jsx (Final Version)

  import React, { useState, useEffect, useRef } from 'react';
  import axios from 'axios';

  // --- Helper Functions & Constants ---
  const formatNumber = (value) => { if (!value && value !== 0) return ''; const num = String(value).replace(/,/g, ''); return isNaN(num) ? String(value) : Number(num).toLocaleString(); };
  const unformatNumber = (value) => String(value).replace(/,/g, '');
  const formatPercentage = (value) => { if (!value && value !== 0) return ''; const num = Number(String(value).replace(/,/g, '')); if (isNaN(num)) return String(value); return num.toFixed(2) + '%'; };
  const DISPLAY_ORDER = [ "검색된 회사", "대표자", "사업자번호", "지역", "시평", "3년 실적", "5년 실적", "부채비율", "유동비율", "영업기간", "신용평가", "여성기업", "고용자수", "일자리창출", "품질평가", "비고" ];
  const getStatusClass = (statusText) => { if (statusText === '최신') return 'status-latest'; if (statusText === '1년 경과') return 'status-warning'; if (statusText === '1년 이상 경과') return 'status-old'; return 'status-unknown'; };

  // --- Child Components ---
  function CopyDialog({ isOpen, message, onClose }) {
    const buttonRef = useRef(null);
    useEffect(() => { if (isOpen) { buttonRef.current?.focus(); } }, [isOpen]);
    useEffect(() => {
      const handleKeyDown = (event) => { if (isOpen && event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); onClose(); } };
      window.addEventListener('keydown', handleKeyDown);
      return () => { window.removeEventListener('keydown', handleKeyDown); };
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
          <p>{message}</p>
          <button ref={buttonRef} onClick={onClose}>확인</button>
        </div>
      </div>
    );
  }

  function FileUploader({ type, label, isUploaded, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const handleFileChange = (e) => { setFile(e.target.files[0]); setMessage(''); };
    const handleUpload = async () => {
      if (!file) { setMessage('파일을 선택해주세요.'); return; }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      try {
        setMessage('업로드 중...');
        const response = await axios.post('http://127.0.0.1:8000/api/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage(response.data.message);
        if (onUploadSuccess) onUploadSuccess();
      } catch (err) { setMessage('업로드 실패. 서버를 확인해주세요.'); console.error(err); }
    };
    return (
      <div className="file-uploader">
        <label>{label} 엑셀 파일</label>
        {isUploaded ? <p className="upload-message success">✅ 서버에 파일이 업로드되어 있습니다.</p> : <p className="upload-message warning">⚠️ 파일이 없습니다. 업로드해주세요.</p>}
        <div className="uploader-controls">
          <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
          <button onClick={handleUpload}>업로드</button>
        </div>
        {message && <p className="upload-message info">{message}</p>}
      </div>
    );
  }

  function AdminUpload({ fileStatuses, onUploadSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className={`admin-upload-section ${isOpen ? 'is-open' : ''}`}>
        <div className="admin-header" onClick={() => setIsOpen(!isOpen)}>
          <h2 className="sub-title">관리자 파일 업로드</h2>
          <span className="toggle-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
        <div className="uploaders-grid">
          <FileUploader type="eung" label="전기" isUploaded={fileStatuses.eung} onUploadSuccess={onUploadSuccess} />
          <FileUploader type="tongsin" label="통신" isUploaded={fileStatuses.tongsin} onUploadSuccess={onUploadSuccess} />
          <FileUploader type="sobang" label="소방" isUploaded={fileStatuses.sobang} onUploadSuccess={onUploadSuccess} />
        </div>
      </div>
    );
  }

  // --- Main App Component ---
  function App() {
    const [fileStatuses, setFileStatuses] = useState({ eung: false, tongsin: false, sobang: false });
    const [filters, setFilters] = useState({ name: '', region: '전체', manager: '', min_sipyung: '', max_sipyung: '', min_3y: '', max_3y: '', min_5y: '', max_5y: '' });
    const [fileType, setFileType] = useState('eung');
    
    const [searchedFileType, setSearchedFileType] = useState('eung');

    const [regions, setRegions] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [dialog, setDialog] = useState({ isOpen: false, message: '' });
    
    // [추가] 자동 스크롤과 애니메이션을 위한 상태
    const topSectionRef = useRef(null);
    const searchResultsRef = useRef(null);
    const [animationKey, setAnimationKey] = useState(0);

    const refreshFileStatuses = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/check_files/');
        setFileStatuses(response.data);
      } catch (err) { console.error("파일 상태 확인 실패:", err); }
    };

    useEffect(() => {
      const fetchRegions = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/get_regions/?file_type=${fileType}`);
          setRegions(response.data);
        } catch (err) { console.error("지역 목록 로딩 실패:", err); setRegions([]); }
      };
      refreshFileStatuses();
      fetchRegions();
    }, [fileType]);

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
        const paramsToSend = { ...filters };
        for (const key in paramsToSend) { if (['min_sipyung', 'max_sipyung', 'min_3y', 'max_3y', 'min_5y', 'max_5y'].includes(key)) { paramsToSend[key] = unformatNumber(paramsToSend[key]); } }
        paramsToSend.file_type = fileType;
        const params = new URLSearchParams(paramsToSend).toString();
        const response = await axios.get(`http://127.0.0.1:8000/api/search/?${params}`);
        setSearchResults(response.data);
        // [추가] 자동 스크롤 로직
        // 검색이 성공하면, 검색된 파일 타입을 상태에 저장합니다.
        setSearchedFileType(fileType);

        setTimeout(() => {
          searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (err) { setError('업체 검색 중 오류가 발생했습니다.'); console.error(err); }
      finally { setIsLoading(false); }
    };

    const handleCompanySelect = (company) => {
      // [추가] 자동 스크롤 및 애니메이션 로직
      topSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      setSelectedCompany(company);
      setAnimationKey(prevKey => prevKey + 1);
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
    const handleCopySingle = (key, value) => { navigator.clipboard.writeText(String(value)); setDialog({ isOpen: true, message: `'${key}' 항목이 복사되었습니다.` }); };
    const handleCopyAll = () => {
      if (!selectedCompany) return;
      const textToCopy = DISPLAY_ORDER.map(key => { const value = selectedCompany[key] ?? ''; const formattedKeys = ['시평', '3년 실적', '5년 실적']; return formattedKeys.includes(key) ? formatNumber(value) : String(value); }).join('\n');
      navigator.clipboard.writeText(textToCopy);
      setDialog({ isOpen: true, message: '전체 정보가 클립보드에 복사되었습니다!' });
    };

    return (
      <div className="app-container">
        <h1 className="main-title">업체 검색 및 적격 심사</h1>
        
        <AdminUpload fileStatuses={fileStatuses} onUploadSuccess={refreshFileStatuses} />

        {/* [수정] 좌우 2단 레이아웃 구조 */}
        <div className="main-content-layout">
          
          <div className="left-panel">
            <div className="search-filter-section" ref={topSectionRef}>
              <div className="file-type-selector">
                <h3>검색 대상</h3>
                <div className="radio-group">
                  <label><input type="radio" value="eung" checked={fileType === 'eung'} onChange={(e) => setFileType(e.target.value)} /> 전기</label>
                  <label><input type="radio" value="tongsin" checked={fileType === 'tongsin'} onChange={(e) => setFileType(e.target.value)} /> 통신</label>
                  <label><input type="radio" value="sobang" checked={fileType === 'sobang'} onChange={(e) => setFileType(e.target.value)} /> 소방</label>
                </div>
              </div>
              <div className="filter-grid">
                  <div className="filter-item"><label>업체명</label><input type="text" name="name" value={filters.name} onChange={handleFilterChange} onKeyDown={handleKeyDown} className="filter-input" /></div>
                  <div className="filter-item"><label>지역</label><select name="region" value={filters.region} onChange={handleFilterChange} className="filter-input"><option value="전체">전체</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  <div className="filter-item"><label>담당자</label><input type="text" name="manager" value={filters.manager} onChange={handleFilterChange} className="filter-input" /></div>
                  <div className="filter-item range"><label>시평액 범위</label><div className="range-inputs"><input type="text" name="min_sipyung" value={filters.min_sipyung} onChange={handleFilterChange} placeholder="최소" className="filter-input" /><span>~</span><input type="text" name="max_sipyung" value={filters.max_sipyung} onChange={handleFilterChange} placeholder="최대" className="filter-input" /></div></div>
                  <div className="filter-item range"><label>3년 실적 범위</label><div className="range-inputs"><input type="text" name="min_3y" value={filters.min_3y} onChange={handleFilterChange} placeholder="최소" className="filter-input" /><span>~</span><input type="text" name="max_3y" value={filters.max_3y} onChange={handleFilterChange} placeholder="최대" className="filter-input" /></div></div>
                  <div className="filter-item range"><label>5년 실적 범위</label><div className="range-inputs"><input type="text" name="min_5y" value={filters.min_5y} onChange={handleFilterChange} placeholder="최소" className="filter-input" /><span>~</span><input type="text" name="max_5y" value={filters.max_5y} onChange={handleFilterChange} placeholder="최대" className="filter-input" /></div></div>
                  <div className="filter-item"><label>&nbsp;</label><button onClick={handleSearch} className="search-button" disabled={isLoading}>{isLoading ? '검색 중...' : '검색'}</button></div>
              </div>
            </div>
            
            {searchPerformed && (
              <div className="search-results-list" ref={searchResultsRef}>
                <h2 className="sub-title">검색 결과</h2>
                {isLoading && <p>로딩 중...</p>}
                {!isLoading && searchResults.length === 0 && <p>검색 결과가 없습니다.</p>}
                <ul>
                  {searchResults.map((company, index) => {
                    const isActive = selectedCompany && selectedCompany.사업자번호 === company.사업자번호;
                    const summaryStatus = company['요약상태'] || '미지정';
                    return (
                <li key={index} onClick={() => handleCompanySelect(company)} className={`company-list-item ${isActive ? 'active' : ''}`}>
                  <div className="company-info-wrapper">
                    {/* --- ▼▼▼ [추가] 검색 결과에 작은 뱃지를 추가합니다 ▼▼▼ --- */}
                    {fileTypeLabel && <span className={`file-type-badge-small file-type-${fileTypeLabel}`}>{fileTypeLabel}</span>}
                    <span className="company-name">{company['업체명']}</span>
                  </div>
                  <span className={`summary-status-badge ${getStatusClass(summaryStatus)}`}>{summaryStatus}</span>
                </li>
              );
            })}
          </ul>
              </div>
            )}
          </div>

          <div className="right-panel">
            {searchPerformed && (
              <div className="company-details fade-in" key={animationKey}>
                <div className="details-header">
                  <h2 className="sub-title">업체 상세 정보</h2>
                  <div className={`file-type-badge file-type-${fileType}`}>
                    {fileType === 'eung' && '전기'}
                    {fileType === 'tongsin' && '통신'}
                    {fileType === 'sobang' && '소방'}
                  </div>
                  {selectedCompany && (<button onClick={handleCopyAll} className="copy-all-button">전체 복사</button>)}
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
                                  <button onClick={() => handleCopySingle(key, displayValue)} className="copy-single-button" title={`${key} 복사`}>복사</button>
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
            )}
          </div>
        </div>

        <CopyDialog 
          isOpen={dialog.isOpen} 
          message={dialog.message} 
          onClose={() => setDialog({ isOpen: false, message: '' })} 
        />
      </div>
    );
  }

  export default App;