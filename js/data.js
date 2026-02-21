/**
 * Data Module - Names of Allah PWA
 * Loads and manages the 99 names dataset
 */

export class DataManager {
  constructor() {
    this.names = [];
    this.loaded = false;
  }

  async loadNames() {
    try {
      const response = await fetch('./data/names.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.names = await response.json();
      this.loaded = true;

      console.log(`✅ Loaded ${this.names.length} names`);
      return this.names;

    } catch (error) {
      console.error('❌ Failed to load names:', error);
      throw error;
    }
  }

  getAllNames() {
    return this.names;
  }

  getNameByIndex(index) {
    return this.names.find(name => name.index === parseInt(index));
  }

  searchNames(query) {
    if (!query) return this.names;

    const lowerQuery = query.toLowerCase();

    return this.names.filter(name =>
      name.arabic.includes(query) ||
      name.transliteration.toLowerCase().includes(lowerQuery) ||
      name.english_meaning.toLowerCase().includes(lowerQuery) ||
      name.bahasa_meaning?.toLowerCase().includes(lowerQuery) ||
      name.when_to_invoke?.toLowerCase().includes(lowerQuery)
    );
  }

  getNamesBySource(sourceType) {
    return this.names.filter(name => name.source_type === sourceType);
  }

  getStats() {
    return {
      total: this.names.length,
      fromQuran: this.names.filter(n => n.source_type === 'quran').length,
      fromSunnah: this.names.filter(n => n.source_type === 'sunnah').length,
      withGhazali: this.names.filter(n => n.ghazali_insight).length,
      withProofs: this.names.filter(n => n.proof_quran || n.proof_hadith).length,
    };
  }
}
