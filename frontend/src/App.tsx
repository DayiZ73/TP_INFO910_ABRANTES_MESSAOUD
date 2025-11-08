import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import CreateGroup from './pages/CreateGroup';
import Results from './pages/Results';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGroup />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
