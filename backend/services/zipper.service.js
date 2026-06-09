const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

const createZip = (extensionId, files) => {
  return new Promise(async (resolve, reject) => {
    try {
      const tempDir = os.tmpdir();
      const extensionFolder = path.join(tempDir, `extensio-${extensionId}`);
      const zipPath = path.join(tempDir, `extensio-${extensionId}.zip`);

      // Create extension folder
      if (!fs.existsSync(extensionFolder)) {
        fs.mkdirSync(extensionFolder, { recursive: true });
      }

      // Write all files to the folder
      for (const file of files) {
        const filePath = path.join(extensionFolder, file.filename);
        const fileDir = path.dirname(filePath);
        
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        
        if (file.encoding === 'base64') {
          fs.writeFileSync(filePath, file.content, 'base64');
        } else {
          fs.writeFileSync(filePath, file.content, 'utf8');
        }
      }

      // Create zip archive
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        // Cleanup: Remove the extension folder
        setTimeout(() => {
          try {
            fs.rmSync(extensionFolder, { recursive: true, force: true });
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }, 1000); // Small delay to ensure file is not locked

        resolve(zipPath);
      });

      archive.on('error', (err) => {
        // Cleanup on error
        fs.rmSync(extensionFolder, { recursive: true, force: true });
        reject(err);
      });

      archive.pipe(output);
      archive.directory(extensionFolder, false);
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

const cleanupZip = (zipPath) => {
  try {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  } catch (error) {
    console.error('Error deleting zip file:', error);
  }
};

module.exports = { createZip, cleanupZip };
// Zip creation service
