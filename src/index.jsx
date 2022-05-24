import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import urlParams from "./utils/url-params";

const RENDER_MODE = !!urlParams.get('render');
window.RENDER_MODE = RENDER_MODE;

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
