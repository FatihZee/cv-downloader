// api/download-cv.js
export default async function handler(req, res) {
  try {
    // Folder ID dari Google Drive kamu
    const folderId = '13ZCeT0_FqYBARL5j_WYQhl3MJfqhqLx9';
    
    // Google Drive API URL untuk ambil file list
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name)`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({
        error: 'Failed to access Google Drive',
        message: data.error?.message || 'Unknown error'
      });
    }
    
    const files = data.files || [];
    let latestFile = null;
    let latestDate = new Date(0);
    
    // Loop semua file untuk cari CV terbaru
    files.forEach(file => {
      const fileName = file.name;
      
      // Pattern: CV_DD-MM-YYYY.pdf (support berbagai separator)
      const dateMatch = fileName.match(/CV[_\-*](\d{2})[_\-*](\d{2})[_\-*](\d{4})\.pdf$/i);
      
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const year = parseInt(dateMatch[3]);
        
        // Buat Date object (month - 1 karena JS month start dari 0)
        const fileDate = new Date(year, month - 1, day);
        
        if (fileDate > latestDate) {
          latestDate = fileDate;
          latestFile = file;
        }
      }
    });
    
    // Kalau ada file, redirect ke download
    if (latestFile) {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${latestFile.id}`;
      return res.redirect(302, downloadUrl);
    }
    
    // Kalau tidak ada file ditemukan
    return res.status(404).json({
      error: 'CV not found',
      message: 'No CV file found with format CV_DD-MM-YYYY.pdf',
      searched_files: files.map(f => f.name)
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}