export default function Header({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'books', label: 'Sách' },
    { key: 'readers', label: 'Độc giả' },
    { key: 'borrowed', label: 'Phiếu mượn' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">Quản lý Thư viện</h1>
        <nav className="nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`nav-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
