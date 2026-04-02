import { useState, useEffect } from 'react';
import { collection, addDoc, setDoc, doc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { restaurantsData } from './data';
import './index.css';

function App() {
  const [selectedCity, setSelectedCity] = useState('台中');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  
  // Stats & Likes
  const [likesData, setLikesData] = useState({}); // { name: count }
  
  // Picker State
  const [pickerState, setPickerState] = useState({ show: false, text: '', result: '' });
  
  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewForm, setReviewForm] = useState({ restaurant: '', author: '', comment: '', rating: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Listen to Reviews
    const qReviews = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
      setLoadingReviews(false);
    });

    // Listen to Likes
    const qLikes = collection(db, 'likes');
    const unsubLikes = onSnapshot(qLikes, (snapshot) => {
      const likesMap = {};
      snapshot.docs.forEach(doc => {
        likesMap[doc.id] = doc.data().count || 0;
      });
      setLikesData(likesMap);
    });

    return () => { unsubReviews(); unsubLikes(); };
  }, []);

  const handleLike = async (name) => {
    const likeRef = doc(db, 'likes', name);
    const currentCount = likesData[name] || 0;
    try {
        await setDoc(likeRef, { count: currentCount + 1 }, { merge: true });
    } catch (err) {
        console.error("Like error:", err);
    }
  };

  const filteredRestaurants = restaurantsData
    .filter(item => {
      const matchCity = item.city === selectedCity;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || item.type.includes(filterType);
      return matchCity && matchSearch && matchType;
    })
    .sort((a, b) => {
      const countA = likesData[a.name] || 0;
      const countB = likesData[b.name] || 0;
      return countB - countA; // Sort by likes descending
    });

  const getTypeBadgeClass = (type) => {
    if (type.includes('吃到飽')) return 'type-all-you-can-eat';
    if (type.includes('套餐')) return 'type-set-menu';
    if (type.includes('個人')) return 'type-individual';
    if (type.includes('單點')) return 'type-ala-carte';
    if (type.includes('專人')) return 'type-mixed';
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
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(url, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      return true; 
    } catch {
      return false;
    }
  };

  const startPicker = () => {
    const cityPool = restaurantsData.filter(r => r.city === selectedCity);
    if (cityPool.length === 0) return;

    setPickerState({ show: true, text: `正在從${selectedCity}最強口袋名單中挑選...`, result: '' });
    
    // Weighted Random Algorithm
    // Weight = 1 + likes (ensures everyone has at least 1 chance)
    const weights = cityPool.map(r => (likesData[r.name] || 0) + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    setTimeout(async () => {
      let randomNum = Math.random() * totalWeight;
      let winner = cityPool[0];
      
      for (let i = 0; i < cityPool.length; i++) {
        randomNum -= weights[i];
        if (randomNum <= 0) {
          winner = cityPool[i];
          break;
        }
      }

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
    } catch (err) {
        alert('發表失敗：' + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="animate-in">{selectedCity}燒肉 <span className="highlight">最強排行榜</span></h1>
          <p className="animate-in delay-1">2026 {selectedCity}地區精選・必吃口袋名單</p>
          <div className="hero-stats animate-in delay-2">
            <div className="stat-item"><span className="stat-value">{filteredRestaurants.length}+</span><span className="stat-label">店家名單</span></div>
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
        <section className="city-selector fade-up">
           <div className="city-tabs">
              {['台中', '彰化', '斗六', '嘉義', '台南'].map(city => (
                <button 
                  key={city}
                  className={`city-tab ${selectedCity === city ? 'active' : ''}`}
                  onClick={() => { setSelectedCity(city); setMapUrl(''); }}>
                  {city}
                </button>
              ))}
           </div>
        </section>

        <section className="filters-section">
          <div className="filter-group">
            {['all', '吃到飽', '套餐制', '個人套餐', '專人代烤'].map(type => (
              <button key={type} 
                className={`filter-btn ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}>
                {type === 'all' ? '全部類型' : type}
              </button>
            ))}
          </div>
          <div className="search-box">
            <input type="text" placeholder={`搜尋${selectedCity}店家名稱或地點...`} 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </section>

        <section className="main-content-layout">
          <div id="mapPreview" className="map-preview-container">
            {!mapUrl ? (
              <div className="map-placeholder">
                <i className="fas fa-map-marked-alt"></i>
                <p>點擊左側店家地址</p><small>即可直接在此預覽位置</small>
              </div>
            ) : (
              <iframe src={mapUrl} style={{ display: 'block' }} allowFullScreen></iframe>
            )}
          </div>

          <div className="table-container shadow-lg fade-up">
            <div className="table-header">
              <div className="col-rank">人氣</div>
              <div className="col-name">店家名稱 / 推薦度</div>
              <div className="col-type">類型</div>
              <div className="col-price">平均價位</div>
              <div className="col-location">地址 (地圖)</div>
              <div className="col-action">操作</div>
            </div>
            <div className="table-body">
              {filteredRestaurants.map((item, idx) => {
                const hasLink = item.link && item.link !== '#';
                const likes = likesData[item.name] || 0;
                return (
                  <div key={idx} className={`table-row animate-in ${!hasLink ? 'no-link-row' : ''}`}>
                    <div className="col-rank">
                        <div className="like-badge">
                            <i className="fas fa-fire"></i> {likes}
                        </div>
                    </div>
                    <div className="col-name">
                        <div className="name-with-tag">
                            {item.name}
                            {item.name.includes('官東') && <span className="recommend-tag">👑 行家推薦</span>}
                            {likes > 10 && <span className="hot-tag">🔥 超人氣</span>}
                        </div>
                    </div>
                    <div className="col-type"><span className={`type-badge ${getTypeBadgeClass(item.type)}`}>{item.type}</span></div>
                    <div className="col-price">{item.price}</div>
                    <div className="col-location">
                      <a href="#" className="address-link" onClick={(e) => { e.preventDefault(); handlePreviewMap(item.name, item.address); }}>
                        <i className="fas fa-map-marker-alt"></i> {item.address}
                      </a>
                    </div>
                    <div className="col-action">
                      <div className="action-buttons">
                        <button className="like-btn" onClick={() => handleLike(item.name)}>
                            <i className="fas fa-thumbs-up"></i> 喜歡
                        </button>
                        {hasLink ? <a href={item.link} target="_blank" rel="noreferrer" className="reserve-btn">預約</a> : <span className="reserve-btn disabled-btn">尚未提供</span>}
                      </div>
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
                {restaurantsData.filter(r => r.city === selectedCity).map((item, i) => (
                  <option key={i} value={item.name}>{item.name}</option>
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
        <p>&copy; 2026 {selectedCity}燒肉最強推薦委員會. <br/>React + Vite 跨城市版本升級 ⚛️</p>
      </footer>
    </>
  );
}

export default App;
