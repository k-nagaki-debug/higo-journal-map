let map;
let markers = [];
let infoWindows = [];
let currentFacilityMarker = null;
let allFacilities = [];
let filteredFacilities = [];

// Initialize Google Map
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

    // マップクリックで施設登録は不要
    // ユーザーは「新規作成」ボタンから登録フォームを開く

    // Load existing facilities
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
    
    // Add markers for filtered facilities (only if they have coordinates)
    filteredFacilities.forEach(facility => {
        if (facility.latitude && facility.longitude) {
            addMarker(facility);
        }
    });
    
    // Center map on filtered facilities with coordinates
    const facilitiesWithCoords = filteredFacilities.filter(f => f.latitude && f.longitude);
    if (facilitiesWithCoords.length > 0) {
        centerMapOnFacilities(facilitiesWithCoords);
    }
}

// Show facility form when map is clicked
function showFacilityForm(latLng, facilityData = null) {
    const modal = document.getElementById('facility-modal');
    const form = document.getElementById('facility-form');
    const modalTitle = document.getElementById('modal-title');
    
    // Reset form
    form.reset();
    
    // Reset image preview
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('facility-image-url').value = '';
    
    if (facilityData) {
        // Edit mode
        modalTitle.textContent = '施設情報編集';
        document.getElementById('facility-id').value = facilityData.id;
        document.getElementById('facility-name').value = facilityData.name;
        document.getElementById('facility-category').value = facilityData.category || '';
        document.getElementById('facility-description').value = facilityData.description || '';
        document.getElementById('facility-address').value = facilityData.address || '';
        document.getElementById('facility-phone').value = facilityData.phone || '';
        document.getElementById('facility-website').value = facilityData.website || '';
        document.getElementById('facility-lat').value = facilityData.latitude || '';
        document.getElementById('facility-lng').value = facilityData.longitude || '';
        
        // Show existing image if available
        if (facilityData.image_url) {
            document.getElementById('facility-image-url').value = facilityData.image_url;
            document.getElementById('preview-img').src = facilityData.image_url;
            document.getElementById('image-preview').classList.remove('hidden');
        }
    } else {
        // Create mode
        modalTitle.textContent = '新規施設登録';
        // 緯度・経度は空のまま（ユーザーが入力可能）
        document.getElementById('facility-lat').value = '';
        document.getElementById('facility-lng').value = '';
        
        // マップクリックから呼び出された場合は一時マーカーを削除
        if (currentFacilityMarker) {
            currentFacilityMarker.setMap(null);
            currentFacilityMarker = null;
        }
    }
    
    modal.classList.remove('hidden');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('facility-modal');
    modal.classList.add('hidden');
    
    // Remove temporary marker
    if (currentFacilityMarker) {
        currentFacilityMarker.setMap(null);
        currentFacilityMarker = null;
    }
}

// Handle image file selection
document.getElementById('facility-image').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

// Remove image
function removeImage() {
    document.getElementById('facility-image').value = '';
    document.getElementById('facility-image-url').value = '';
    document.getElementById('image-preview').classList.add('hidden');
}

// Handle form submission
document.getElementById('facility-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const facilityId = document.getElementById('facility-id').value;
    const imageFile = document.getElementById('facility-image').files[0];
    let imageUrl = document.getElementById('facility-image-url').value;
    
    try {
        // Upload image if a new file is selected
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const uploadResponse = await axios.post('/api/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (uploadResponse.data.success) {
                imageUrl = uploadResponse.data.data.imageUrl;
            }
        }
        
        const latValue = document.getElementById('facility-lat').value;
        const lngValue = document.getElementById('facility-lng').value;
        
        const facilityData = {
            name: document.getElementById('facility-name').value,
            category: document.getElementById('facility-category').value,
            description: document.getElementById('facility-description').value,
            address: document.getElementById('facility-address').value,
            phone: document.getElementById('facility-phone').value,
            website: document.getElementById('facility-website').value,
            latitude: latValue ? parseFloat(latValue) : null,
            longitude: lngValue ? parseFloat(lngValue) : null,
            image_url: imageUrl || null
        };
        
        let response;
        if (facilityId) {
            // Update existing facility
            response = await axios.put(`/api/facilities/${facilityId}`, facilityData);
        } else {
            // Create new facility
            response = await axios.post('/api/facilities', facilityData);
        }
        
        if (response.data.success) {
            closeModal();
            await loadFacilities();
            alert(facilityId ? '施設情報を更新しました' : '施設を登録しました');
        }
    } catch (error) {
        console.error('Error saving facility:', error);
        alert('施設の保存に失敗しました');
    }
});

// Load all facilities
async function loadFacilities() {
    try {
        const response = await axios.get('/api/facilities');
        
        if (response.data.success) {
            allFacilities = response.data.data;
            filteredFacilities = [...allFacilities];
            
            // Clear existing markers
            markers.forEach(marker => marker.setMap(null));
            infoWindows.forEach(infoWindow => infoWindow.close());
            markers = [];
            infoWindows = [];
            
            // Add markers for each facility (only if they have coordinates)
            filteredFacilities.forEach(facility => {
                if (facility.latitude && facility.longitude) {
                    addMarker(facility);
                }
            });
            
            // Update facility list
            displayFacilityList(filteredFacilities);
            
            // Center map on facilities with coordinates
            const facilitiesWithCoords = filteredFacilities.filter(f => f.latitude && f.longitude);
            if (facilitiesWithCoords.length > 0) {
                centerMapOnFacilities(facilitiesWithCoords);
            }
            // マップ位置はデフォルトのまま（熊本市中心）
        }
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

// Center map on all facilities
function centerMapOnFacilities(facilities) {
    if (facilities.length === 0) return;
    
    if (facilities.length === 1) {
        // Single facility: center on it with zoom 15
        const facility = facilities[0];
        map.setCenter({ lat: facility.latitude, lng: facility.longitude });
        map.setZoom(15);
    } else {
        // Multiple facilities: fit bounds to show all markers
        const bounds = new google.maps.LatLngBounds();
        facilities.forEach(f => {
            bounds.extend({ lat: f.latitude, lng: f.longitude });
        });
        map.fitBounds(bounds);
    }
}

// Add marker to map
function addMarker(facility) {
    const position = { lat: facility.latitude, lng: facility.longitude };
    
    // Red marker for saved facilities
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: facility.name,
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
    });
    
    // Create info window content
    const infoContent = createPopupContent(facility);
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

// Create popup content
function createPopupContent(facility) {
    const categoryBadge = facility.category ? 
        `<span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">${facility.category}</span>` : '';
    
    const imageHtml = facility.image_url ? 
        `<img src="${facility.image_url}" alt="${facility.name}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 0.5rem; margin-top: 0.5rem;">` : '';
    
    return `
        <div style="max-width: 300px;">
            <h3 style="font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5rem; color: #1f2937;">${facility.name}</h3>
            ${categoryBadge}
            ${imageHtml}
            ${facility.description ? `<p style="margin-top: 0.5rem; color: #374151;">${facility.description}</p>` : ''}
            ${facility.address ? `<p style="margin-top: 0.5rem; font-size: 0.875rem; color: #4b5563;"><i class="fas fa-map-marker-alt"></i> ${facility.address}</p>` : ''}
            ${facility.phone ? `<p style="font-size: 0.875rem; color: #4b5563;"><i class="fas fa-phone"></i> ${facility.phone}</p>` : ''}
            ${facility.website ? `<p style="font-size: 0.875rem;"><a href="${facility.website}" target="_blank" style="color: #2563eb; text-decoration: underline;"><i class="fas fa-external-link-alt"></i> 記事リンク</a></p>` : ''}
            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                <button onclick="editFacility(${facility.id})" style="font-size: 0.875rem; background-color: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; border: none; cursor: pointer;">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button onclick="deleteFacility(${facility.id})" style="font-size: 0.875rem; background-color: #ef4444; color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; border: none; cursor: pointer;">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `;
}

// Display facility list
function displayFacilityList(facilities) {
    const listContainer = document.getElementById('facility-list');
    
    if (facilities.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">登録された施設はありません</p>';
        return;
    }
    
    listContainer.innerHTML = facilities.map(facility => {
        const hasCoords = facility.latitude && facility.longitude;
        const onclickAttr = hasCoords ? `onclick="focusOnFacility(${facility.latitude}, ${facility.longitude})"` : '';
        const cursorClass = hasCoords ? 'cursor-pointer' : '';
        
        return `
        <div class="facility-card bg-gray-50 p-4 rounded-lg border border-gray-200 ${cursorClass}"
             ${onclickAttr}>
            ${facility.image_url ? `<img src="${facility.image_url}" alt="${facility.name}" class="w-full h-40 object-cover rounded-lg mb-3">` : ''}
            <h3 class="text-lg font-bold text-gray-800 mb-1">${facility.name}</h3>
            ${facility.category ? `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">${facility.category}</span>` : ''}
            ${!hasCoords ? `<span class="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded mb-2"><i class="fas fa-map-marker-slash"></i> 位置情報なし</span>` : ''}
            ${facility.description ? `<p class="text-sm text-gray-600 mt-2 line-clamp-2">${facility.description}</p>` : ''}
            ${facility.address ? `<p class="text-xs text-gray-500 mt-2"><i class="fas fa-map-marker-alt"></i> ${facility.address}</p>` : ''}
            <div class="mt-3 flex gap-2">
                <button onclick="event.stopPropagation(); editFacility(${facility.id})" 
                        class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button onclick="event.stopPropagation(); deleteFacility(${facility.id})" 
                        class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Focus on facility when clicked from list
function focusOnFacility(lat, lng) {
    map.setCenter({ lat: lat, lng: lng });
    map.setZoom(15);
    
    // Find and open the marker's info window
    const marker = markers.find(m => m.facilityData && 
        m.facilityData.latitude === lat && m.facilityData.longitude === lng);
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

// Edit facility
async function editFacility(facilityId) {
    try {
        const response = await axios.get(`/api/facilities/${facilityId}`);
        
        if (response.data.success) {
            const facility = response.data.data;
            const latLng = { lat: facility.latitude, lng: facility.longitude };
            showFacilityForm(latLng, facility);
        }
    } catch (error) {
        console.error('Error loading facility:', error);
        alert('施設情報の取得に失敗しました');
    }
}

// Delete facility
async function deleteFacility(facilityId) {
    if (!confirm('この施設を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        const response = await axios.delete(`/api/facilities/${facilityId}`);
        
        if (response.data.success) {
            await loadFacilities();
            alert('施設を削除しました');
        }
    } catch (error) {
        console.error('Error deleting facility:', error);
        alert('施設の削除に失敗しました');
    }
}

// Show new facility form (without map click)
function showNewFacilityForm() {
    showFacilityForm(null);
}

// Geocode address to get coordinates
async function geocodeAddress() {
    const addressInput = document.getElementById('facility-address');
    const address = addressInput.value.trim();
    
    if (!address) {
        alert('住所を入力してください');
        return;
    }
    
    try {
        // Use Google Maps Geocoding API
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();
                
                // Set coordinates
                document.getElementById('facility-lat').value = lat;
                document.getElementById('facility-lng').value = lng;
                
                // Show marker on map
                if (currentFacilityMarker) {
                    currentFacilityMarker.setMap(null);
                }
                
                currentFacilityMarker = new google.maps.Marker({
                    position: { lat: lat, lng: lng },
                    map: map,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    },
                    animation: google.maps.Animation.DROP
                });
                
                // Center map on the location
                map.setCenter({ lat: lat, lng: lng });
                map.setZoom(15);
                
                alert(`座標を取得しました！\n緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}`);
            } else {
                let errorMessage = '住所から座標を取得できませんでした。';
                if (status === 'ZERO_RESULTS') {
                    errorMessage = '指定された住所が見つかりませんでした。住所を確認してください。';
                } else if (status === 'OVER_QUERY_LIMIT') {
                    errorMessage = 'APIの利用制限に達しました。しばらく待ってから再度お試しください。';
                } else if (status === 'REQUEST_DENIED') {
                    errorMessage = 'ジオコーディングAPIが無効です。APIキーの設定を確認してください。';
                }
                alert(errorMessage);
                console.error('Geocoding error:', status, results);
            }
        });
    } catch (error) {
        console.error('Error during geocoding:', error);
        alert('ジオコーディング中にエラーが発生しました。');
    }
}

// Make functions available globally
window.closeModal = closeModal;
window.showNewFacilityForm = showNewFacilityForm;
window.editFacility = editFacility;
window.deleteFacility = deleteFacility;
window.focusOnFacility = focusOnFacility;
window.removeImage = removeImage;
window.geocodeAddress = geocodeAddress;
