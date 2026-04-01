document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('restaurantList');
    const linksElement = document.getElementById('bookingLinks');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Picker Elements
    const pickerBtn = document.getElementById('randomPickerBtn');
    const overlay = document.getElementById('selectionOverlay');
    const pickerStatus = document.getElementById('pickerStatus');
    const pickerResult = document.getElementById('pickerResult');

    const getTypeBadgeClass = (type) => {
        if (type.includes('吃到飽')) return 'type-all-you-can-eat';
        if (type.includes('套餐')) return 'type-set-menu';
        if (type.includes('個人')) return 'type-individual';
        if (type.includes('單點')) return 'type-ala-carte';
        return 'type-mixed';
    };

    const renderList = (data) => {
        listElement.innerHTML = '';
        data.forEach(item => {
            const hasLink = item.link && item.link !== '#';
            const mapsQuery = encodeURIComponent(`${item.name} ${item.address}`);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

            const row = document.createElement('div');
            row.className = `table-row animate-in ${!hasLink ? 'no-link-row' : ''}`;
            row.innerHTML = `
                <div class="col-rank">${item.rank}</div>
                <div class="col-name">${item.name}</div>
                <div class="col-type"><span class="type-badge ${getTypeBadgeClass(item.type)}">${item.type}</span></div>
                <div class="col-price">${item.price}</div>
                <div class="col-location">
                    <a href="${mapsUrl}" target="_blank" class="address-link">
                        <i class="fas fa-map-marker-alt"></i> ${item.address}
                    </a>
                </div>
                <div class="col-action">
                    ${!hasLink 
                        ? `<span class="reserve-btn disabled-btn">尚未提供</span>` 
                        : `<a href="${item.link}" target="_blank" class="reserve-btn">立即訂位</a>`}
                </div>
            `;
            listElement.appendChild(row);
        });
    };

    const renderLinks = () => {
        linksElement.innerHTML = '';
        bookingLinks.forEach(link => {
            const card = document.createElement('a');
            card.href = link.url;
            card.target = '_blank';
            card.className = 'link-card';
            card.textContent = link.name;
            linksElement.appendChild(card);
        });
    };

    const handleFilter = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const activeType = document.querySelector('.filter-btn.active').dataset.type;

        const filtered = restaurantsData.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm) || 
                              item.address.toLowerCase().includes(searchTerm);
            const matchType = activeType === 'all' || item.type.includes(activeType);
            return matchSearch && matchType;
        });

        renderList(filtered);
    };

    // Advanced Link Check (Best Effort for Static Site)
    const checkUrlStatus = async (url) => {
        if (!url || url === '#') return false;
        
        try {
            // Static sites have CORS limitations, so we attempt a 'no-cors' fetch
            // If it succeeds (network OK), we assume 200 for now.
            // If it fails (network error), we fallback.
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000); // 2s timeout
            
            await fetch(url, { mode: 'no-cors', signal: controller.signal });
            clearTimeout(id);
            return true; 
        } catch (e) {
            console.log("Link check failed, falling back to Maps:", url);
            return false;
        }
    };

    // Random Picker Logic
    const startPicker = () => {
        overlay.classList.remove('hidden');
        pickerStatus.textContent = "正在從最強口袋名單中為您挑選...";
        pickerResult.classList.add('hidden');
        pickerResult.textContent = "";

        setTimeout(async () => {
            const winner = restaurantsData[Math.floor(Math.random() * restaurantsData.length)];
            pickerStatus.textContent = "🔥 您的今日命定燒肉是：";
            pickerResult.textContent = winner.name;
            pickerResult.classList.remove('hidden');

            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${winner.name} ${winner.address}`)}`;
            
            setTimeout(async () => {
                pickerStatus.textContent = "正在檢查訂位連結狀態...";
                
                const isLive = await checkUrlStatus(winner.link);
                const finalTarget = isLive ? winner.link : mapsUrl;

                pickerStatus.textContent = isLive ? "正在前往官網訂位..." : "官網連結異常，正在開啟地圖導航...";
                
                setTimeout(() => {
                    window.open(finalTarget, '_blank');
                    overlay.classList.add('hidden');
                }, 1000);
            }, 2000);
        }, 2500);
    };

    // Event Listeners
    searchInput.addEventListener('input', handleFilter);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            handleFilter();
        });
    });

    pickerBtn.addEventListener('click', startPicker);

    // Initial Render
    renderList(restaurantsData);
    renderLinks();
});
