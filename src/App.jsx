import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { restaurantsData, bookingLinks } from './data';
import './index.css';

function App() {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  
  // Picker State
  const [pickerState, setPickerState] = useState({ show: false, text: '', result: '' });
  
  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewForm, setReviewForm] = useState({ restaurant: '', author: '', comment: '', rating: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(data);
      setLoadingReviews(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoadingReviews(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredRestaurants = restaurantsData.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || item.type.includes(filterType);
    return matchSearch && matchType;
  });

  const getTypeBadgeClass = (type) => {
    if (type.includes('吃到飽')) return 'type-all-you-can-eat';
    if (type.includes('套餐')) return 'type-set-menu';
    if (type.includes('個人')) return 'type-individual';
    if (type.includes('單點')) return 'type-ala-carte';
    return 'type-mixed';
  };

  const handlePreviewMap = (name, address) => {
    const encoded = encodeURIComponent(`${name} ${address}`);
    setMapUrl(`https://maps.google.com/maps?q=${encoded}&output=embed&t=m&z=16`);
    if (window.innerWidth < 1100) {
      document.getElementById('mapPreview')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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

  const startPicker = () => {
    setPickerState({ show: true, text: "正在從最強口袋名單中為您挑選...", result: '' });
    setTimeout(async () => {
      const winner = restaurantsData[Math.floor(Math.random() * restaurantsData.length)];
      setPickerState({ show: true, text: "🔥 您的今日命定燒肉是：", result: winner.name });

      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${winner.name} ${winner.address}`)}`;
      
      setTimeout(async () => {
        setPickerState(prev => ({ ...prev, text: "正在檢查訂位連結狀態..." }));
        const isLive = await checkUrlStatus(winner.link);
        const finalTarget = isLive ? winner.link : mapsUrl;
        setPickerState(prev => ({ ...prev, text: isLive ? "正在前往官網訂位..." : "官網連結異常，正在開啟地圖導航..." }));
        setTimeout(() => {
          window.open(finalTarget, '_blank');
          setPickerState(prev => ({ ...prev, show: false }));
        }, 1000);
      }, 2000);
    }, 2500);
  };

  const submitReview = async () => {
    const { restaurant, author, comment, rating } = reviewForm;
    if (!restaurant || !author || !comment || rating === 0) {
        alert('親，記得填完資料並給個好評喔！');
        return;
    }
    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'reviews'), {
            restaurant, author, comment, rating,
            timestamp: serverTimestamp()
        });
        alert('🔥 感謝分享！評論已即時雲端同步！');
        setReviewForm({ restaurant: '', author: '', comment: '', rating: 0 });
    } catch (e) {
        alert('發表失敗：' + e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="animate-in">台中燒肉 <span className="highlight">最強排行榜</span></h1>
          <p className="animate-in delay-1">2026 頂級精選・必吃口袋名單</p>
          <div className="hero-stats animate-in delay-2">
            <div className="stat-item"><span className="stat-value">20+</span><span className="stat-label">店家名單</span></div>
            <div className="stat-item"><span className="stat-value">$400起</span><span className="stat-label">親民價位</span></div>
            <div className="stat-item"><span className="stat-value">Top 100%</span><span className="stat-label">CP 值認證</span></div>
          </div>
          <div className="hero-action animate-in delay-3">
            <button className="picker-btn" onClick={startPicker}>
              <i className="fas fa-dice"></i> 🥩 猶豫不決？靈魂選肉機
            </button>
          </div>
        </div>
      </header>

      {pickerState.show && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="picker-spinner"></div>
            <h2>{pickerState.text}</h2>
            {pickerState.result && <div className="result-text">{pickerState.result}</div>}
          </div>
        </div>
      )}

      <main className="container">
        <section className="filters-section">
          <div className="filter-group">
            {['all', '吃到飽', '套餐制', '個人套餐'].map(type => (
              <button key={type} 
                className={`filter-btn ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}>
                {type === 'all' ? '全部' : type}
              </button>
            ))}
          </div>
          <div className="search-box">
            <input type="text" placeholder="搜尋店家名稱或地點..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </section>

        <section className="main-content-layout">
          <div id="mapPreview" className="map-preview-container">
            {!mapUrl ? (
              <div className="map-placeholder">
                <i className="fas fa-map-marked-alt"></i>
                <p>點擊右側店家地址</p><small>即可直接在此預覽位置</small>
              </div>
            ) : (
              <iframe src={mapUrl} style={{ display: 'block' }} allowFullScreen></iframe>
            )}
          </div>

          <div className="table-container shadow-lg fade-up">
            <div className="table-header">
              <div className="col-rank">排名</div>
              <div className="col-name">店家名稱</div>
              <div className="col-type">類型</div>
              <div className="col-price">平均價位</div>
              <div className="col-location">地址 (地圖)</div>
              <div className="col-action">預約</div>
            </div>
            <div className="table-body">
              {filteredRestaurants.map((item, idx) => {
                const hasLink = item.link && item.link !== '#';
                return (
                  <div key={idx} className={`table-row animate-in ${!hasLink ? 'no-link-row' : ''}`}>
                    <div className="col-rank">{item.rank}</div>
                    <div className="col-name">{item.name}</div>
                    <div className="col-type"><span className={`type-badge ${getTypeBadgeClass(item.type)}`}>{item.type}</span></div>
                    <div className="col-price">{item.price}</div>
                    <div className="col-location">
                      <a href="#" className="address-link" onClick={(e) => { e.preventDefault(); handlePreviewMap(item.name, item.address); }}>
                        <i className="fas fa-map-marker-alt"></i> {item.address}
                      </a>
                    </div>
                    <div className="col-action">
                      {hasLink ? <a href={item.link} target="_blank" rel="noreferrer" className="reserve-btn">立即訂位</a> : <span className="reserve-btn disabled-btn">尚未提供</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="reviews-section fade-up">
          <h2 className="section-title">🔥 炭火食記評論牆</h2>
          <div className="review-compose">
            <div className="compose-header">
              <h3>分享您的美味記憶</h3>
              <div className="rating-input">
                <span className="star-label">給個好評：</span>
                <div className="stars">
                  {[1,2,3,4,5].map(v => (
                    <i key={v} className={v <= reviewForm.rating ? 'fas fa-star' : 'far fa-star'} 
                       onClick={() => setReviewForm({...reviewForm, rating: v})} style={{ cursor: 'pointer' }}></i>
                  ))}
                </div>
              </div>
            </div>
            <div className="compose-body">
              <select className="review-select" value={reviewForm.restaurant} onChange={e => setReviewForm({...reviewForm, restaurant: e.target.value})}>
                <option value="" disabled>請選擇您品嚐過的店家</option>
                {restaurantsData.map((item, i) => (
                  <option key={i} value={item.name}>{item.rank}. {item.name}</option>
                ))}
              </select>
              <input type="text" placeholder="您的暱稱 (例如：肉肉特攻隊)" className="review-input" 
                value={reviewForm.author} onChange={e => setReviewForm({...reviewForm, author: e.target.value})} />
              <textarea placeholder="分享這家店的 CP 值、服務或是必點美味..." className="review-textarea"
                value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}></textarea>
              <button className="submit-btn" onClick={submitReview} disabled={isSubmitting}>
                {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> 上傳同步中...</> : <><i className="fas fa-paper-plane"></i> 發表評論</>}
              </button>
            </div>
          </div>

          <div className="reviews-wall">
            {loadingReviews ? (
              <div className="loading-reviews"><i className="fas fa-spinner fa-spin"></i> 正在火速載入大家的食記...</div>
            ) : reviews.length === 0 ? (
              <div className="loading-reviews">此處尚無煙火... 快來搶頭香評價！</div>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="review-card">
                  <span className="review-restaurant-tag">{rev.restaurant}</span>
                  <div className="review-card-header">
                    <span className="review-author">{rev.author}</span>
                    <span className="review-date">{rev.timestamp ? rev.timestamp.toDate().toLocaleDateString() : ''}</span>
                  </div>
                  <div className="review-stars">
                    {[1,2,3,4,5].map(v => <i key={v} className={v <= rev.rating ? 'fas fa-star' : 'far fa-star'}></i>)}
                  </div>
                  <p className="review-content">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 台中燒肉最強推薦委員會. <br/>內容已由 React 重構升級 ⚛️</p>
      </footer>
    </>
  );
}

export default App;
