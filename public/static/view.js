let map;
let markers = [];
let allFacilities = [];
let filteredFacilities = [];

// Initialize Leaflet Map (Read-only mode)
async function initMap() {
    // Default center: Tokyo
    const center = [35.6812, 139.7671];
    
    map = L.map('map').setView(center, 12);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // No click listener - read-only mode

    // Load existing facilities and center map
    await loadFacilities();
    
    // Setup search and filter listeners
    setupSearchAndFilter();
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', initMap);

// Setup search and filter event listeners
function setupSearchAndFilter() {
    const searchInput = document.getElementById('map-search-input');
    const categoryFilter = document.getElementById('map-category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
}

// Apply search and filter
function applyFilters() {
    const searchTerm = document.getElementById('map-search-input')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('map-category-filter')?.value || '';
    
    filteredFacilities = allFacilities.filter(facility => {
        const matchesSearch = !searchTerm || 
            facility.name.toLowerCase().includes(searchTerm) ||
            (facility.description && facility.description.toLowerCase().includes(searchTerm)) ||
            (facility.address && facility.address.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || facility.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    // Update markers on map
    updateMarkers();
    
    // Update facility list
    displayFacilityList(filteredFacilities);
}

// Update markers based on filtered facilities
function updateMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add markers for filtered facilities
    filteredFacilities.forEach(facility => {
        addMarker(facility);
    });
    
    // Center map on filtered facilities if any exist
    if (filteredFacilities.length > 0) {
        centerMapOnFacilities(filteredFacilities);
    }
}

// Add marker to map (Read-only - no edit functionality)
function addMarker(facility) {
    const marker = L.marker([facility.latitude, facility.longitude])
        .addTo(map);
    
    // Create popup content
    const popupContent = `
        <div style="min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${facility.name}</h3>
            ${facility.image_url ? `<img src="${facility.image_url}" alt="${facility.name}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">` : ''}
            ${facility.category ? `<p style="margin: 5px 0;"><strong>カテゴリ:</strong> ${facility.category}</p>` : ''}
            ${facility.description ? `<p style="margin: 5px 0;">${facility.description}</p>` : ''}
            ${facility.address ? `<p style="margin: 5px 0;"><strong>住所:</strong> ${facility.address}</p>` : ''}
            ${facility.phone ? `<p style="margin: 5px 0;"><strong>電話:</strong> ${facility.phone}</p>` : ''}
            ${facility.website ? `<p style="margin: 5px 0;"><a href="${facility.website}" target="_blank" style="color: #3b82f6;">記事を見る</a></p>` : ''}
        </div>
    `;
    
    marker.bindPopup(popupContent);
    markers.push(marker);
}

// Center map on facilities
function centerMapOnFacilities(facilities) {
    if (facilities.length === 0) return;
    
    if (facilities.length === 1) {
        map.setView([facilities[0].latitude, facilities[0].longitude], 14);
    } else {
        const bounds = L.latLngBounds(
            facilities.map(f => [f.latitude, f.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Load facilities from API
async function loadFacilities() {
    try {
        const response = await axios.get('/api/facilities');
        
        if (response.data.success) {
            allFacilities = response.data.data;
            filteredFacilities = [...allFacilities];
            
            // Add markers to map
            allFacilities.forEach(facility => {
                addMarker(facility);
            });
            
            // Center map on all facilities
            if (allFacilities.length > 0) {
                centerMapOnFacilities(allFacilities);
            }
            
            // Display facility list
            displayFacilityList(allFacilities);
        }
    } catch (error) {
        console.error('Failed to load facilities:', error);
    }
}

// Display facility list
function displayFacilityList(facilities) {
    const listContainer = document.getElementById('facility-list');
    
    if (!facilities || facilities.length === 0) {
        listContainer.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>施設が登録されていません</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = facilities.map(facility => `
        <div class="facility-card bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onclick="focusOnFacility(${facility.id})">
            ${facility.image_url ? `
                <img src="${facility.image_url}" alt="${facility.name}" class="w-full h-32 object-cover rounded mb-3">
            ` : ''}
            <h3 class="text-lg font-bold text-gray-800 mb-2">${facility.name}</h3>
            ${facility.category ? `
                <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${getCategoryColor(facility.category)}">
                    ${facility.category}
                </span>
            ` : ''}
            ${facility.description ? `<p class="text-sm text-gray-600 mb-2 line-clamp-2">${facility.description}</p>` : ''}
            ${facility.address ? `<p class="text-xs text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>${facility.address}</p>` : ''}
        </div>
    `).join('');
}

// Get category color
function getCategoryColor(category) {
    const colors = {
        '観光': 'bg-blue-100 text-blue-800',
        '飲食': 'bg-red-100 text-red-800',
        '宿泊': 'bg-green-100 text-green-800',
        'ショッピング': 'bg-yellow-100 text-yellow-800',
        '寺社': 'bg-purple-100 text-purple-800',
        '公園': 'bg-green-100 text-green-800',
        'その他': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['その他'];
}

// Focus on specific facility
function focusOnFacility(facilityId) {
    const facility = allFacilities.find(f => f.id === facilityId);
    if (facility) {
        map.setView([facility.latitude, facility.longitude], 16);
        
        // Find and open the marker popup
        const marker = markers.find(m => {
            const latlng = m.getLatLng();
            return latlng.lat === facility.latitude && latlng.lng === facility.longitude;
        });
        
        if (marker) {
            marker.openPopup();
        }
    }
}
