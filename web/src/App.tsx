import { Route, Routes } from 'react-router-dom';

import Nav from './components/Nav';
import Backlog from './pages/Backlog';
import Board from './pages/Board';
import DocsList from './pages/DocsList';
import DocView from './pages/DocView';
import EpicDetail from './pages/EpicDetail';
import Epics from './pages/Epics';
import TicketDetail from './pages/TicketDetail';

function NotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell">
      <Nav />
      {/* tabIndex=-1 lets the skip link in Nav move focus here programmatically */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/epics" element={<Epics />} />
          <Route path="/epics/:id" element={<EpicDetail />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/docs" element={<DocsList />} />
          <Route path="/docs/:slug" element={<DocView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
