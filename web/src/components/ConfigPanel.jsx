import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import packageJson from '../../package.json';

const __APP_VERSION__ = packageJson.version;

export default function ConfigPanel({ isOpen, onClose, initialConfig, onSaveConfig }) {
  const [backupPath, setBackupPath] = useState(initialConfig?.backupPath || '');
  const [downloadQuality, setDownloadQuality] = useState(initialConfig?.downloadQuality || 'highestaudio');
  const [dataSaver, setDataSaver] = useState(initialConfig?.dataSaver || false);
  const { language, changeLanguage, t } = useLanguage();

  useEffect(() => {
    if (initialConfig) {
      setBackupPath(initialConfig.backupPath || '');
      setDownloadQuality(initialConfig.downloadQuality || 'highestaudio');
      setDataSaver(initialConfig.dataSaver || false);
    }
  }, [initialConfig]);

  const handleSave = () => {
    onSaveConfig({ backupPath, downloadQuality, dataSaver });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 bg-surface-container-high z-[80] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container">
          <h2 className="text-xl font-bold text-on-surface">{t('config.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 flex-grow flex flex-col space-y-6 overflow-y-auto">
          {/* Language Selector */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">{t('config.language')}</h3>
            <p className="text-xs text-on-surface-variant font-light mb-4 leading-relaxed">
              {t('config.language_desc')}
            </p>
            <div className="flex flex-col space-y-3">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono text-sm cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">{t('config.backup_dir')}</h3>
            <p className="text-xs text-on-surface-variant font-light mb-4 leading-relaxed">
              {t('config.backup_dir_desc')}
            </p>
            
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                value={backupPath}
                onChange={(e) => setBackupPath(e.target.value)}
                placeholder="/path/to/folder..."
                className="w-full bg-surface-container-low border border-surface-container rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
              
              <h3 className="text-sm font-semibold text-primary mt-4 mb-2 uppercase tracking-wider">Download Quality</h3>
              <select
                value={downloadQuality}
                onChange={(e) => setDownloadQuality(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono text-sm cursor-pointer"
              >
                <option value="highestaudio">Highest Audio</option>
                <option value="lowestaudio">Lowest Audio</option>
              </select>

              <div className="flex items-center justify-between mt-4 mb-2 bg-surface-container border border-surface-container-high p-3 rounded-lg">
                <div>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Ahorro de datos</h3>
                  <p className="text-xs text-on-surface-variant font-light mt-1">Baja la calidad de streaming (no afecta descargas)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={dataSaver} onChange={(e) => setDataSaver(e.target.checked)} />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:brightness-110 transition-all active:scale-95 mt-4"
              >
                {t('config.save_path')}
              </button>
            </div>
          </div>
          
          <div className="pt-6 border-t border-surface-container flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-1 uppercase tracking-wider">{t('config.about')}</h3>
              <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                Ramona Music
              </p>
            </div>
            <div className="text-[10px] text-on-surface-variant opacity-50 font-mono">
              v{__APP_VERSION__ || '0.0.1'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
