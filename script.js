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

    // Review Elements
    const reviewSelect = document.getElementById('reviewRestaurant');
    const ratingStars = document.querySelectorAll('#ratingStars i');
    const submitReviewBtn = document.getElementById('submitReview');
    const reviewsWall = document.getElementById('reviewsWall');
    let selectedRating = 0;

    const getTypeBadgeClass = (type) => {
        if (type.includes('吃到飽')) return 'type-all-you-can-eat';
        if (type.includes('套餐')) return 'type-set-menu';
        if (type.includes('個人')) return 'type-individual';
        if (type.includes('單點')) return 'type-ala-carte';
        return 'type-mixed';
    };

    const renderList = (data) => {
        listElement.innerHTML = '';
        
        // Clear and repopulate review select
        const currentVal = reviewSelect.value;
        reviewSelect.innerHTML = '<option value="" disabled selected>請選擇您品嚐過的店家</option>';
        
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

            // Populate select option
            const option = document.createElement('option');
            option.value = item.name;
            option.textContent = `${item.rank}. ${item.name}`;
            reviewSelect.appendChild(option);
        });
        if (currentVal) reviewSelect.value = currentVal;
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

    // Advanced Link Check 
    const checkUrlStatus = async (url) => {
        if (!url || url === '#') return false;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);
            await fetch(url, { mode: 'no-cors', signal: controller.signal });
            clearTimeout(id);
            return true; 
        } catch (e) {
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

    // Star Rating Interactivity
    ratingStars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.dataset.value);
            ratingStars.forEach((s, idx) => {
                s.className = idx < val ? 'fas fa-star' : 'far fa-star';
            });
        });
        
        star.addEventListener('mouseout', () => {
            ratingStars.forEach((s, idx) => {
                s.className = idx < selectedRating ? 'fas fa-star' : 'far fa-star';
            });
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            ratingStars.forEach((s, idx) => {
                s.className = idx < selectedRating ? 'fas fa-star' : 'far fa-star';
            });
        });
    });

    // Review Logic (LocalStorage Placeholder until Firebase keys arrived)
    const loadReviews = () => {
        // This will be replaced by Firebase getDocs
        const mockReviews = JSON.parse(localStorage.getItem('restaurant_reviews') || '[]');
        if (mockReviews.length === 0) {
            reviewsWall.innerHTML = '<div class="loading-reviews">目前尚無評論，快來搶頭香！</div>';
            return;
        }
        
        reviewsWall.innerHTML = '';
        mockReviews.reverse().forEach(rev => {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <span class="review-restaurant-tag">${rev.restaurant}</span>
                <div class="review-card-header">
                    <span class="review-author">${rev.author}</span>
                    <span class="review-date">${new Date(rev.time).toLocaleDateString()}</span>
                </div>
                <div class="review-stars">
                    ${'<i class="fas fa-star"></i>'.repeat(rev.rating)}${'<i class="far fa-star"></i>'.repeat(5-rev.rating)}
                </div>
                <p class="review-content">${rev.text}</p>
            `;
            reviewsWall.appendChild(card);
        });
    };

    const saveReview = () => {
        const restaurant = reviewSelect.value;
        const author = document.getElementById('reviewAuthor').value;
        const text = document.getElementById('reviewText').value;

        if (!restaurant || !author || !text || selectedRating === 0) {
            alert('親，請填寫完整資訊並給個評分喔！');
            return;
        }

        const newReview = {
            restaurant, author, text, rating: selectedRating, time: Date.now()
        };

        // For now, save to localStorage
        const reviews = JSON.parse(localStorage.getItem('restaurant_reviews') || '[]');
        reviews.push(newReview);
        localStorage.setItem('restaurant_reviews', JSON.stringify(reviews));

        // Feedback
        alert('感謝您的分享！評論已同步火速上傳！');
        
        // Reset and Reload
        document.getElementById('reviewAuthor').value = '';
        document.getElementById('reviewText').value = '';
        selectedRating = 0;
        ratingStars.forEach(s => s.className = 'far fa-star');
        loadReviews();
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
    submitReviewBtn.addEventListener('click', saveReview);

    // Initial Render
    renderList(restaurantsData);
    renderLinks();
    loadReviews();
});
