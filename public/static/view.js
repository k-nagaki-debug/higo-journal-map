let map;
let markers = [];
let infoWindows = [];
let allFacilities = [];
let filteredFacilities = [];

// Initialize Google Map (Read-only mode)
async function initMap() {
    // Default center: Kumamoto City
    const center = { lat: 32.7898, lng: 130.7417 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });

    // No click listener - read-only mode

    // Load existing facilities and center map
    await loadFacilities();
    
    // Setup search and filter listeners
    setupSearchAndFilter();
}

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
    markers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(infoWindow => infoWindow.close());
    markers = [];
    infoWindows = [];
    
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
    const position = { lat: facility.latitude, lng: facility.longitude };
    
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: facility.name,
        animation: google.maps.Animation.DROP
    });
    
    // Create info window content
    const infoContent = `
        <div style="max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${facility.name}</h3>
            ${facility.image_url ? `<img src="${facility.image_url}" alt="${facility.name}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">` : ''}
            ${facility.category ? `<p style="margin: 5px 0; color: #4b5563;"><strong>カテゴリ:</strong> ${facility.category}</p>` : ''}
            ${facility.description ? `<p style="margin: 5px 0; color: #6b7280;">${facility.description}</p>` : ''}
            ${facility.address ? `<p style="margin: 5px 0; color: #4b5563;"><strong>住所:</strong> ${facility.address}</p>` : ''}
            ${facility.phone ? `<p style="margin: 5px 0; color: #4b5563;"><strong>電話:</strong> ${facility.phone}</p>` : ''}
            ${facility.website ? `<p style="margin: 5px 0;"><a href="${facility.website}" target="_blank" style="color: #3b82f6; text-decoration: underline;">記事を見る</a></p>` : ''}
        </div>
    `;
    
    const infoWindow = new google.maps.InfoWindow({
        content: infoContent
    });
    
    marker.addListener('click', () => {
        // Close all other info windows
        infoWindows.forEach(iw => iw.close());
        infoWindow.open(map, marker);
    });
    
    markers.push(marker);
    infoWindows.push(infoWindow);
    
    // Store facility data with marker
    marker.facilityData = facility;
}

// Center map on facilities
function centerMapOnFacilities(facilities) {
    if (facilities.length === 0) return;
    
    if (facilities.length === 1) {
        map.setCenter({ lat: facilities[0].latitude, lng: facilities[0].longitude });
        map.setZoom(14);
    } else {
        const bounds = new google.maps.LatLngBounds();
        facilities.forEach(f => {
            bounds.extend({ lat: f.latitude, lng: f.longitude });
        });
        map.fitBounds(bounds);
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
        map.setCenter({ lat: facility.latitude, lng: facility.longitude });
        map.setZoom(16);
        
        // Find and open the marker's info window
        const marker = markers.find(m => m.facilityData && m.facilityData.id === facilityId);
        const infoWindow = infoWindows[markers.indexOf(marker)];
        
        if (marker && infoWindow) {
            // Close all other info windows
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
            
            // Add bounce animation
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);
        }
    }
}

// Make focusOnFacility available globally
window.focusOnFacility = focusOnFacility;
