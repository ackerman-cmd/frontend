import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';

import { store } from './app/store/store';
import App from './App';

import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider
          locale={ruRU}
          theme={{
            token: {
              colorPrimary: '#FFDD2D',
              colorInfo: '#FFDD2D',
              colorSuccess: '#52C41A',
              colorWarning: '#FAAD14',
              colorError: '#FF4D4F',
              borderRadius: 12,
              wireframe: false,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              colorBgLayout: '#F5F5F5',
              colorBgContainer: '#FFFFFF',
              colorText: '#1A1A1A',
              colorTextSecondary: '#595959',
              colorBorder: '#EBEBEB',
            },
            components: {
              Layout: {
                headerBg: '#FFFFFF',
                bodyBg: '#F5F5F5',
                siderBg: '#1A1A1A',
              },
              Card: {
                borderRadiusLG: 12,
              },
              Modal: {
                borderRadiusLG: 16,
              },
              Table: {
                headerBg: '#FAFAFA',
                headerColor: '#595959',
                borderColor: '#EBEBEB',
              },
              Select: {
                optionSelectedBg: '#FFFBE6',
              },
              Tag: {
                borderRadiusSM: 999,
              },
            },
          }}
        >
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
