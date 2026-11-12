import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="App">
      <Sidebar />
      {children}
    </div>
  );
}
