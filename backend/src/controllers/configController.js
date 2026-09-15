import fs from 'fs-extra';
import path from 'path';

const configDir = process.env.RAMONA_DATA_DIR || process.cwd();
const configFilePath = path.join(configDir, 'ramona-config.json');

export const getConfig = async (req, res) => {
  try {
    if (await fs.pathExists(configFilePath)) {
      const config = await fs.readJson(configFilePath);
      return res.json({ ...config, downloadQuality: config.downloadQuality || 'highestaudio' });
    }
    let defaultPath = process.env.MUSIC_PATH || path.join(process.cwd(), 'backups');
    if (process.platform === 'android') {
      defaultPath = '/storage/emulated/0/ramona/backups/';
    }
    return res.json({ backupPath: defaultPath, downloadQuality: 'highestaudio' });
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({ error: 'Failed to read config' });
  }
};

export const saveConfig = async (req, res) => {
  try {
    const { backupPath, downloadQuality } = req.body;
    if (!backupPath) {
      return res.status(400).json({ error: 'backupPath is required' });
    }
    
    // Ensure directory exists or create it
    await fs.ensureDir(backupPath);

    const config = { backupPath, downloadQuality: downloadQuality || 'highestaudio' };
    await fs.writeJson(configFilePath, config, { spaces: 2 });
    
    return res.json({ success: true, config });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save config' });
  }
};
