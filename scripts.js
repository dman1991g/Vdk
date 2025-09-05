// Globale Variablen
let videosData = [];
let filteredVideos = [];
let currentPage = 1;
const videosPerPage = 24;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFilter = document.getElementById('category-filter');
const tagFilter = document.getElementById('tag-filter');
const sortBySelect = document.getElementById('sort-by');
const videosGrid = document.getElementById('videos-grid');
const paginationContainer = document.getElementById('pagination');
const modal = document.getElementById('video-modal');
const closeModalBtn = document.querySelector('.close');
const openVideoButton = document.getElementById('open-video-button');
const copyPathButton = document.getElementById('copy-path-button');

// Daten laden - ANGEPASSTE VERSION FÜR LOKALE DATEIEN
async function loadData() {
    try {
        // Beispiel für hartcodierte Daten (als Fallback)
        const fallbackData = [
            {
                "id": "1",
                "title": "Test Video 1",
                "description": "Das ist ein Test-Video.",
                "date": "2023-01-01",
                "categories": ["Test"],
                "tags": ["Demo"],
                "video_url": "",
                "video_id": "",
                "thumbnail": "",
                "local_path": "Videos/test1.mp4"
            },
            {
                "id": "2",
                "title": "Test Video 2",
                "description": "Ein weiteres Test-Video.",
                "date": "2023-02-01",
                "categories": ["Beispiel"],
                "tags": ["Test"],
                "video_url": "",
                "video_id": "",
                "thumbnail": "",
                "local_path": "Videos/test2.mp4"
            }
        ];
        
        try {
            // Versuche zuerst, die JSON-Datei zu laden
            const response = await fetch('data/video_data.json');
            if (response.ok) {
                videosData = await response.json();
                console.log('Daten aus JSON geladen:', videosData.length + ' Videos');
            } else {
                throw new Error('Konnte JSON nicht laden');
            }
        } catch (fetchError) {
            console.warn('Fehler beim Laden der JSON-Datei, verwende Fallback-Daten:', fetchError);
            // Als Fallback die hartcodierten Daten verwenden
            videosData = fallbackData;
        }
        
        // Initial setup
        setupFilters();
        applyFilters();
        renderVideos();
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        videosGrid.innerHTML = '<p class="error-message">Fehler beim Laden der Videodaten. Bitte versuche es später erneut.</p>';
    }
}

// Filter-Dropdowns mit Daten füllen
function setupFilters() {
    // Kategorien sammeln
    const categories = new Set();
    videosData.forEach(video => {
        if (video.categories && Array.isArray(video.categories)) {
            video.categories.forEach(category => categories.add(category));
        }
    });
    
    // Kategorien-Dropdown füllen
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Tags sammeln
    const tags = new Set();
    videosData.forEach(video => {
        if (video.tags && Array.isArray(video.tags)) {
            video.tags.forEach(tag => tags.add(tag));
        }
    });
    
    // Tags-Dropdown füllen
    Array.from(tags).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

// Filter und Suche anwenden
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedTag = tagFilter.value;
    const sortBy = sortBySelect.value;
    
    // Filtern nach Suchbegriff, Kategorie und Tag
    filteredVideos = videosData.filter(video => {
        const matchesSearch = 
            video.title.toLowerCase().includes(searchTerm) || 
            (video.description && video.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = selectedCategory === '' || 
            (video.categories && video.categories.includes(selectedCategory));
        
        const matchesTag = selectedTag === '' || 
            (video.tags && video.tags.includes(selectedTag));
        
        return matchesSearch && matchesCategory && matchesTag;
    });
    
    // Sortieren
    switch (sortBy) {
        case 'date-desc':
            filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filteredVideos.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'title-asc':
            filteredVideos.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredVideos.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    
    // Zurück zur ersten Seite
    currentPage = 1;
    
    // Videos und Pagination rendern
    renderVideos();
    renderPagination();
}

// Videos im Grid anzeigen
function renderVideos() {
    // Berechne Start- und End-Index für Paginierung
    const startIndex = (currentPage - 1) * videosPerPage;
    const endIndex = startIndex + videosPerPage;
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);
    
    // Leere das Grid
    videosGrid.innerHTML = '';
    
    // Zeige Nachricht, wenn keine Videos gefunden wurden
    if (paginatedVideos.length === 0) {
        videosGrid.innerHTML = '<p class="no-results">Keine Videos gefunden. Bitte ändere deine Suchkriterien.</p>';
        return;
    }
    
    // Videos rendern
    paginatedVideos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.dataset.videoId = video.id;
        
        // Formatiere das Datum
        const date = new Date(video.date);
        const formattedDate = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Standard-Thumbnail, falls keines definiert ist
        const thumbnailUrl = video.thumbnail || 'assets/thumbnails/default.jpg';
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnailUrl}" alt="${video.title}" onerror="this.src='assets/thumbnails/default.jpg'">
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    <span>${formattedDate}</span>
                    <span>${video.categories && video.categories[0] || ''}</span>
                </div>
            </div>
        `;
        
        // Klick-Event hinzufügen
        videoCard.addEventListener('click', () => openVideoModal(video));
        
        videosGrid.appendChild(videoCard);
    });
}

// Pagination-Buttons rendern
function renderPagination() {
    const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
    
    paginationContainer.innerHTML = '';
    
    // Keine Pagination, wenn es nur eine Seite gibt
    if (totalPages <= 1) return;
    
    // "Vorherige"-Button
    if (currentPage > 1) {
        addPaginationButton('«', currentPage - 1);
    }
    
    // Seitenzahlen
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // Anpassen, wenn wir am Ende sind
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // Erste Seite, wenn wir nicht am Anfang sind
    if (startPage > 1) {
        addPaginationButton(1, 1);
        if (startPage > 2) {
            paginationContainer.innerHTML += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    // Seitenzahlen
    for (let i = startPage; i <= endPage; i++) {
        addPaginationButton(i, i, i === currentPage);
    }
    
    // Letzte Seite, wenn wir nicht am Ende sind
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationContainer.innerHTML += '<span class="pagination-ellipsis">...</span>';
        }
        addPaginationButton(totalPages, totalPages);
    }
    
    // "Nächste"-Button
    if (currentPage < totalPages) {
        addPaginationButton('»', currentPage + 1);
    }
}

// Pagination-Button hinzufügen
function addPaginationButton(text, page, isActive = false) {
    const button = document.createElement('button');
    button.className = `page-button ${isActive ? 'active-page' : ''}`;
    button.textContent = text;
    button.addEventListener('click', () => {
        currentPage = page;
        renderVideos();
        renderPagination();
        // Zurück nach oben scrollen
        window.scrollTo(0, 0);
    });
    paginationContainer.appendChild(button);
}

// Video-Modal öffnen
function openVideoModal(video) {
    // Modal-Inhalte setzen
    document.getElementById('modal-title').textContent = video.title;
    
    // Thumbnail setzen mit Fallback
    const thumbnailImg = document.getElementById('modal-thumbnail');
    thumbnailImg.src = video.thumbnail || 'assets/thumbnails/default.jpg';
    thumbnailImg.onerror = function() {
        this.src = 'assets/thumbnails/default.jpg';
    };
    
    document.getElementById('modal-date').textContent = new Date(video.date).toLocaleDateString('de-DE');
    document.getElementById('modal-category').textContent = video.categories ? video.categories.join(', ') : '';
    document.getElementById('modal-tags').textContent = video.tags ? video.tags.join(', ') : '';
    document.getElementById('modal-path').textContent = video.local_path || 'Nicht verfügbar';
    document.getElementById('modal-description').innerHTML = video.description || '';
    
    // Buttons konfigurieren
    openVideoButton.dataset.path = video.local_path;
    copyPathButton.dataset.path = video.local_path;
    
    // Modal anzeigen
    modal.style.display = 'block';
    
    // Verhindern, dass die Seite im Hintergrund scrollt
    document.body.style.overflow = 'hidden';
}

// Modal schließen
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadData);

searchButton.addEventListener('click', applyFilters);
searchInput.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        applyFilters();
    }
});

categoryFilter.addEventListener('change', applyFilters);
tagFilter.addEventListener('change', applyFilters);
sortBySelect.addEventListener('change', applyFilters);

closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', event => {
    if (event.target === modal) {
        closeModal();
    }
});

// Video öffnen mit VLC Portable über Batch-Datei
openVideoButton.addEventListener('click', function() {
    const path = this.dataset.path;
    if (path && path !== 'Nicht verfügbar') {
        try {
            // Erstelle eine temporäre Batch-Datei für dieses spezifische Video
            const batchContent = `@echo off
set "VLC_PATH=%~dp0Tools\\VLC-Portable\\VLCPortable_3.0.21.paf.exe"
if not exist "%VLC_PATH%" (
    echo VLC Portable nicht gefunden. Bitte installiere VLC Portable im Tools-Ordner.
    pause
    exit /b 1
)
if not exist "${path}" (
    echo Video nicht gefunden: ${path}
    pause
    exit /b 1
)
echo Starte Video: ${path.split('/').pop()}
"%VLC_PATH%" "${path}"
if %ERRORLEVEL% NEQ 0 (
    echo Fehler beim Öffnen des Videos.
    echo Versuche manuell zu öffnen: ${path}
    pause
)`;


// Erstelle einen Download-Link für die Batch-Datei
            const blob = new Blob([batchContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `play-${path.split('/').pop().replace(/\.[^/.]+$/, "")}.bat`;
            
            // Zeige Anweisungen für den Benutzer
            const instructions = `
Video wird vorbereitet zum Abspielen:

OPTION 1 - Automatisch (Empfohlen):
1. Die Batch-Datei wird automatisch heruntergeladen
2. Speichere sie im Hauptordner des Archivs (neben der HTML-Datei)
3. Doppelklicke auf die Batch-Datei zum Abspielen

OPTION 2 - Manuell:
1. Navigiere zu: ${path}
2. Doppelklicke auf die Videodatei
3. Oder öffne VLC und lade die Datei

Videodatei: ${path.split('/').pop()}
Vollständiger Pfad: ${path}
            `;
            
            // Zeige Anweisungen und starte Download
            alert(instructions);
            
            // Automatischer Download der Batch-Datei
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            // Fallback: Zeige einfache Anweisungen
            const fallbackInstructions = `
Video öffnen:

1. Navigiere zu diesem Pfad: ${path}
2. Doppelklicke auf die Videodatei
3. Oder öffne VLC Portable manuell:
   - Gehe zu: Tools/VLC-Portable/VLCPortable_3.0.21.paf.exe
   - Öffne VLC und lade das Video: ${path}

Videodatei: ${path.split('/').pop()}
            `;
            alert(fallbackInstructions);
        }
    } else {
        alert('Kein Dateipfad verfügbar!');
    }
});

// Pfad kopieren - Verbesserte Version mit Anweisungen
copyPathButton.addEventListener('click', function() {
    const path = this.dataset.path;
    if (path && path !== 'Nicht verfügbar') {
        // In die Zwischenablage kopieren
        navigator.clipboard.writeText(path)
            .then(() => {
                // Erfolgs-Feedback mit Anleitung
                this.innerHTML = '✓ Kopiert!';
                
                const instructions = `
Pfad erfolgreich kopiert!

So öffnest du das Video:

OPTION 1 - Mit VLC Portable:
1. Gehe zu: Tools/VLC-Portable/VLCPortable_3.0.21.paf.exe
2. Doppelklicke um VLC zu öffnen
3. Drücke Strg+O (oder Medien > Datei öffnen)
4. Füge den kopierten Pfad ein (Strg+V)

OPTION 2 - Datei-Explorer:
1. Öffne den Windows Explorer
2. Füge den Pfad in die Adressleiste ein (Strg+V)
3. Drücke Enter
4. Doppelklicke auf die Videodatei

Kopierter Pfad: ${path}
                `;
                
                alert(instructions);
                
                setTimeout(() => {
                    this.innerHTML = '🔗 Pfad kopieren';
                }, 3000);
            })
            .catch(err => {
                console.error('Fehler beim Kopieren: ', err);
                alert('Der Pfad konnte nicht kopiert werden: ' + path);
            });
    } else {
        alert('Kein Dateipfad verfügbar!');
    }
});