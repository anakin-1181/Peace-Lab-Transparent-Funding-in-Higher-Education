import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DataReferencePage } from './pages/DataReferencePage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { OverviewPage } from './pages/OverviewPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/data-reference" element={<DataReferencePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
