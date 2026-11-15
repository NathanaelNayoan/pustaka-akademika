/**
 * PustakaAkademika — Open Library Public API Integration
 * Mengambil referensi data buku secara otomatis menggunakan Fetch API.
 */

window.PustakaAPI = (() => {
  const BASE_URL = 'https://openlibrary.org/search.json';

  /**
   * Mencari buku dari Open Library API berdasarkan kata kunci (judul atau ISBN).
   * @param {string} query Kata kunci pencarian
   * @returns {Promise<Array>} Daftar maksimal 5 hasil buku yang sudah dinormalisasi
   */
  async function searchOpenLibrary(query) {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      throw new Error('Kata kunci pencarian tidak boleh kosong.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = `${BASE_URL}?q=${encodeURIComponent(cleanQuery)}&limit=5`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Server Open Library merespons dengan status ${response.status}`);
      }

      const data = await response.json();
      const docs = Array.isArray(data.docs) ? data.docs : [];

      return docs.slice(0, 5).map((doc) => {
        const title = doc.title || 'Judul Tidak Diketahui';
        const author = Array.isArray(doc.author_name) && doc.author_name.length > 0
          ? doc.author_name.slice(0, 2).join(', ')
          : 'Penulis Tidak Diketahui';
        const year = doc.first_publish_year ? Number(doc.first_publish_year) : '';
        const isbn = Array.isArray(doc.isbn) && doc.isbn.length > 0
          ? doc.isbn[0]
          : '';
        const subjects = Array.isArray(doc.subject) ? doc.subject.join(' ').toLowerCase() : '';

        return {
          title,
          author,
          year,
          isbn,
          suggestedCategory: inferCategory(subjects)
        };
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Koneksi timeout. Periksa jaringan internet Anda.');
      }
      throw new Error(error.message || 'Gagal menghubungi Open Library API.');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Menebak kategori yang paling sesuai dari subjek Open Library.
   */
  function inferCategory(subjectsText) {
    if (!subjectsText) return '';
    if (/computer|programming|software|algorithm|technology|data/.test(subjectsText)) {
      return 'Teknologi';
    }
    if (/physics|biology|chemistry|science|mathematics|astronomy/.test(subjectsText)) {
      return 'Sains';
    }
    if (/fiction|novel|poetry|literature|drama/.test(subjectsText)) {
      return 'Sastra';
    }
    if (/economics|business|finance|management|accounting/.test(subjectsText)) {
      return 'Ekonomi';
    }
    if (/history|historical|civilization|war|biography/.test(subjectsText)) {
      return 'Sejarah';
    }
    return '';
  }

  return {
    searchOpenLibrary
  };
})();