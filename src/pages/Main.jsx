import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import bg from '../assets/background_mygame2.png';
import frogNormal from '../assets/frog_normal.PNG';

const TABS = ['홈', '랭킹', '패치노트', '게시판', '접속유저'];

function Main() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('홈');
  const [hasNewPatch, setHasNewPatch] = useState(false);
  const [hasNewPost, setHasNewPost] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const trackOnline = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('nickname').eq('id', user.id).single();
    
      // 접속 시 등록
      await supabase.from('online_users').upsert({
        id: user.id,
        nickname: userData.nickname,
        last_seen: new Date().toISOString(),
      });

      // 30초마다 last_seen 업데이트
      const interval = setInterval(async () => {
        await supabase.from('online_users').upsert({
          id: user.id,
          nickname: userData.nickname,
          last_seen: new Date().toISOString(),
        });
      }, 30000);

      // 페이지 닫으면 삭제
      const handleUnload = async () => {
        await supabase.from('online_users').delete().eq('id', user.id);
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleUnload);
      };
    };
    trackOnline();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      setProfile(data);
    };
    getUser();
    checkNew();
  }, [navigate]);

  const checkNew = async () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: patches } = await supabase
      .from('patch_notes')
      .select('id')
      .gte('created_at', tenMinAgo)
      .limit(1);
    if (patches?.length > 0) setHasNewPatch(true);

    const { data: posts } = await supabase
      .from('posts')
      .select('id')
      .gte('created_at', tenMinAgo)
      .limit(1);
    if (posts?.length > 0) setHasNewPost(true);
  };

  const handleLogout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('online_users').delete().eq('id', user.id);
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!profile) return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a1628',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#f5c842', fontFamily: "'Jua', sans-serif", fontSize: '1.5rem'
    }}>
      🐸 로딩중...
    </div>
  );

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Jua', sans-serif",
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 0 }} />

      {/* 상단바 */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid #4a7c3f',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4cff72', boxShadow: '0 0 6px #4cff72' }} />
          {profile.nickname}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f5c842', fontSize: '1.4rem', textShadow: '0 0 10px #f5c842' }}>
          <img src={frogNormal} alt="frog" style={{ width: '32px', imageRendering: 'pixelated' }} />
          Frog Jump
        </div>
        <button onClick={handleLogout} style={{
          padding: '6px 16px', borderRadius: '8px',
          border: '1px solid #4a7c3f', background: 'rgba(0,0,0,0.5)',
          color: '#fff', cursor: 'pointer', fontSize: '0.95rem',
          fontFamily: "'Jua', sans-serif",
        }}>로그아웃</button>
      </div>

      {/* 네비게이션 탭 */}
      <div style={{
        position: 'fixed', top: '60px', left: 0, right: 0, height: '48px',
        background: 'rgba(0,0,0,0.85)', borderBottom: '2px solid #4a7c3f',
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: '4px', zIndex: 100,
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              position: 'relative',
              padding: '8px 24px', borderRadius: '8px',
              border: activeTab === tab ? '1px solid #4a7c3f' : '1px solid transparent',
              background: activeTab === tab ? 'rgba(74,124,63,0.5)' : 'transparent',
              color: activeTab === tab ? '#f5c842' : '#888',
              cursor: 'pointer', fontSize: '1rem',
              fontFamily: "'Jua', sans-serif",
              transition: 'all 0.2s',
              textShadow: activeTab === tab ? '0 0 8px #f5c842' : 'none',
            }}
          >
            {tab}
            {tab === '패치노트' && hasNewPatch && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                background: '#ff4444', color: '#fff',
                fontSize: '0.6rem', padding: '1px 4px',
                borderRadius: '4px', fontFamily: "'Jua', sans-serif",
              }}>NEW</span>
            )}
            {tab === '게시판' && hasNewPost && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                background: '#ff4444', color: '#fff',
                fontSize: '0.6rem', padding: '1px 4px',
                borderRadius: '4px', fontFamily: "'Jua', sans-serif",
              }}>NEW</span>
            )}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1200px', margin: '0 auto',
        padding: '124px 24px 40px',
      }}>
        {activeTab === '홈' && <HomeTab profile={profile} />}
        {activeTab === '랭킹' && <RankingTab />}
        {activeTab === '패치노트' && <PatchTab profile={profile} />}
        {activeTab === '게시판' && <BoardTab profile={profile} />}
        {activeTab === '접속유저' && <OnlineTab />}
      </div>
    </div>
  );
}
// RankingSummary 함수
function RankingSummary() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    fetch('https://frogjump-leaderboard.onrender.com/leaderboard?limit=5')
      .then(r => r.json())
      .then(data => setRankings(data || []));
  }, []);

  return (
    <div style={{
      flex: 1, background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px', minHeight: '400px',
      boxShadow: '0 0 20px rgba(74,124,63,0.3)',
    }}>
      <h3 style={{ color: '#f5c842', margin: '0 0 16px', fontSize: '1.2rem' }}>🏆 랭킹보드 TOP 5</h3>
      {rankings.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', paddingTop: '60px', fontSize: '0.9rem' }}>
          랭킹 데이터가 없습니다.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(74,124,63,0.2)' }}>
                <td style={{ color: i === 0 ? '#f5c842' : i === 1 ? '#ccc' : i === 2 ? '#cd7f32' : '#888', padding: '10px', textAlign: 'center', width: '40px' }}>
                  {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td style={{ color: '#fff', padding: '10px' }}>{r.nickname}</td>
                <td style={{ color: '#f5c842', padding: '10px', textAlign: 'right' }}>{r.score}점</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
// 홈 탭
function HomeTab({ profile }) {
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname);
  const [showModal, setShowModal] = useState(false);  // ← 추가

  const handleDownload = () => {
    setShowModal(true);
    setTimeout(() => {
      window.location.href = 'https://github.com/s38827550-sys/FrogJumpGame/releases/download/v1.0/frogjumpgame.v1.0.zip';
    }, 1500);
  };

  const handleSaveNickname = async () => {
    if (nickname === profile.nickname) { alert('닉네임이 같아요!'); return; }
    if ((profile.points || 0) < 100) { alert('포인트가 부족해요! (100포인트 필요)'); return; }

    // 닉네임 중복 확인
    const { data: existNick } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single();
    if (existNick) { alert('이미 사용중인 닉네임입니다.'); return; }

    // 닉네임 변경 + 포인트 차감
    const { error } = await supabase
      .from('users')
      .update({
        nickname: nickname,
        points: (profile.points || 0) - 100,
      })
      .eq('id', profile.id);

    if (error) { alert('변경 실패했어요.'); return; }
    alert('닉네임이 변경됐어요! 🐸');
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말 탈퇴하실 건가요?')) return;
    if (!window.confirm('탈퇴 후 24시간 동안 재가입이 불가능해요. 정말 탈퇴할까요?')) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 탈퇴 예약 상태로 변경 (바로 삭제 X)
    const { error } = await supabase
      .from('users')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) { alert('탈퇴 처리 실패했어요.'); return; }

    // 온라인 유저에서 삭제
    await supabase.from('online_users').delete().eq('id', user.id);

    await supabase.auth.signOut();
    alert('탈퇴가 완료됐어요. 이용해주셔서 감사합니다 🐸');
    window.location.href = '/login';
  };

  return (
  <>
    {/* 다운로드 모달 */}
    {showModal && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: '#0a1628', border: '2px solid #4a7c3f',
          borderRadius: '16px', padding: '40px', textAlign: 'center',
          boxShadow: '0 0 30px rgba(74,124,63,0.5)',
          maxWidth: '400px', width: '90%',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🐸</div>
          <h3 style={{ color: '#f5c842', margin: '0 0 12px', fontFamily: "'Jua', sans-serif" }}>
            다운로드가 시작됩니다!
          </h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 8px', fontFamily: "'Jua', sans-serif" }}>
            압축 해제 후 FrogJump.exe를 실행해주세요
          </p>
          <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 24px', fontFamily: "'Jua', sans-serif" }}>
            잠시 후 자동으로 다운로드됩니다...
          </p>
          <button onClick={() => setShowModal(false)} style={{
            padding: '10px 24px', borderRadius: '8px',
            border: '1px solid #4a7c3f', background: 'rgba(74,124,63,0.3)',
            color: '#fff', cursor: 'pointer', fontSize: '1rem',
            fontFamily: "'Jua', sans-serif",
          }}>확인</button>
        </div>
      </div>
    )}

    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      {/* 왼쪽: 게임시작 + 프로필 */}
      <div style={{ width: '300px', flexShrink: 0 }}>
        {/* 게임시작 버튼 */}
        <div style={{
          background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
          borderRadius: '16px 16px 0 0', padding: '16px',
          display: 'flex', justifyContent: 'center',
        }}>
          <button onClick={handleDownload} style={{
            padding: '12px 32px', borderRadius: '12px',
            border: '2px solid #4a7c3f', background: '#4a7c3f',
            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
            fontFamily: "'Jua', sans-serif",
            animation: 'pulse 2s ease-in-out infinite',
          }}
            onMouseEnter={e => e.target.style.background = '#5a9c4f'}
            onMouseLeave={e => e.target.style.background = '#4a7c3f'}
          >🎮 게임 다운로드</button>
        </div>

        {/* 프로필 카드 */}
        <div style={{
          background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
          borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '70px', height: '70px', borderRadius: '50%',
              background: 'rgba(74,124,63,0.3)', border: '2px solid #4a7c3f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', flexShrink: 0,
            }}>🐸</div>
            <div>
              <p style={{ color: '#f5c842', fontSize: '1rem', margin: '0 0 4px' }}>{profile.nickname}</p>
              <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0 0 4px' }}>@{profile.username}</p>
              <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>최고점수: <span style={{ color: '#f5c842' }}>0점</span></p>
              <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>포인트: <span style={{ color: '#7ae8ff' }}>{profile.points || 0}</span></p>
            </div>
          </div>

          <button onClick={() => setEditMode(!editMode)} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            border: '1px solid #4a7c3f', background: editMode ? 'rgba(74,124,63,0.4)' : 'rgba(0,0,0,0.5)',
            color: '#ccc', cursor: 'pointer', fontSize: '0.95rem',
            fontFamily: "'Jua', sans-serif", marginBottom: '8px',
          }}>
            {editMode ? '▲ 닫기' : '✏️ 프로필 수정'}
          </button>

          {editMode && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ color: '#f5c842', fontSize: '0.8rem', margin: '0 0 8px' }}>
                ⚠️ 닉네임 변경 시 100포인트 차감
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#aaa', fontSize: '0.85rem', width: '50px' }}>닉네임</span>
                <input value={nickname} onChange={e => setNickname(e.target.value)} style={{
                  flex: 1, padding: '6px 10px', borderRadius: '6px',
                  border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '0.9rem', outline: 'none',
                  fontFamily: "'Jua', sans-serif",
                }} />
              </div>
              <button onClick={handleSaveNickname} style={{
                width: '100%', padding: '8px', borderRadius: '8px',
                border: '1px solid #4a7c3f', background: 'rgba(74,124,63,0.3)',
                color: '#ccc', cursor: 'pointer', fontSize: '0.95rem',
                fontFamily: "'Jua', sans-serif", marginBottom: '8px',
              }}>저장 (-100포인트)</button>
            </div>
          )}

          <button onClick={handleDeleteAccount} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            border: '1px solid #ff4444', background: 'rgba(0,0,0,0.5)',
            color: '#ff4444', cursor: 'pointer', fontSize: '0.95rem',
            fontFamily: "'Jua', sans-serif",
          }}>회원탈퇴</button>
        </div>
      </div>

      {/* 오른쪽: 랭킹 요약 */}
      <RankingSummary />
    </div>
  </>
  );
}

// 랭킹 탭
function RankingTab() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://frogjump-leaderboard.onrender.com/leaderboard?limit=50')
      .then(r => r.json())
      .then(data => {
        setRankings(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px',
    }}>
      <h3 style={{ color: '#f5c842', margin: '0 0 16px', fontSize: '1.2rem' }}>🏆 전체 랭킹</h3>
      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', paddingTop: '40px' }}>로딩중...</div>
      ) : rankings.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', paddingTop: '40px' }}>랭킹 데이터가 없습니다.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #4a7c3f' }}>
              <th style={{ color: '#aaa', padding: '8px', textAlign: 'center', width: '60px' }}>순위</th>
              <th style={{ color: '#aaa', padding: '8px', textAlign: 'left' }}>닉네임</th>
              <th style={{ color: '#aaa', padding: '8px', textAlign: 'right' }}>점수</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid rgba(74,124,63,0.2)',
                background: i === 0 ? 'rgba(245,200,66,0.1)' : i === 1 ? 'rgba(192,192,192,0.1)' : i === 2 ? 'rgba(205,127,50,0.1)' : 'transparent',
              }}>
                <td style={{ color: i === 0 ? '#f5c842' : i === 1 ? '#ccc' : i === 2 ? '#cd7f32' : '#888', padding: '10px', textAlign: 'center', fontSize: '1.1rem' }}>
                  {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td style={{ color: '#fff', padding: '10px' }}>{r.nickname}</td>
                <td style={{ color: '#f5c842', padding: '10px', textAlign: 'right' }}>{r.score}점</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// 패치노트 탭
function PatchTab({ profile }) {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWrite, setShowWrite] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('');
  const [selectedPatch, setSelectedPatch] = useState(null);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchPatches();
  }, []);

  const fetchPatches = async () => {
    const { data } = await supabase
      .from('patch_notes')
      .select('*, users(nickname)')
      .order('created_at', { ascending: false });
    setPatches(data || []);
    setLoading(false);
  };

  const handleWrite = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요!'); return; }
    if (!content.trim()) { alert('내용을 입력해주세요!'); return; }
    if (!version.trim()) { alert('버전을 입력해주세요!'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('patch_notes').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      version: version.trim(),
    });

    if (error) { alert('작성 실패했어요.'); return; }
    setTitle(''); setContent(''); setVersion('');
    setShowWrite(false);
    fetchPatches();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제할까요?')) return;
    await supabase.from('patch_notes').delete().eq('id', id);
    setSelectedPatch(null);
    fetchPatches();
  };

  if (selectedPatch) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
        borderRadius: '16px', padding: '24px',
      }}>
        <button onClick={() => setSelectedPatch(null)} style={{
          padding: '6px 16px', borderRadius: '8px',
          border: '1px solid #4a7c3f', background: 'transparent',
          color: '#aaa', cursor: 'pointer', fontSize: '0.9rem',
          fontFamily: "'Jua', sans-serif", marginBottom: '16px',
        }}>← 목록으로</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h2 style={{ color: '#f5c842', margin: 0 }}>{selectedPatch.title}</h2>
          <span style={{
            background: 'rgba(74,124,63,0.4)', border: '1px solid #4a7c3f',
            borderRadius: '6px', padding: '2px 10px', color: '#7ae8ff', fontSize: '0.85rem',
          }}>{selectedPatch.version}</span>
        </div>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 24px' }}>
          {new Date(selectedPatch.created_at).toLocaleDateString('ko-KR')}
        </p>
        <div style={{
          color: '#ddd', fontSize: '1rem', lineHeight: '1.8',
          borderTop: '1px solid #4a7c3f', paddingTop: '16px',
          whiteSpace: 'pre-wrap',
        }}>
          {selectedPatch.content}
        </div>

        {isAdmin && (
          <button onClick={() => handleDelete(selectedPatch.id)} style={{
            marginTop: '24px', padding: '8px 20px', borderRadius: '8px',
            border: '1px solid #ff4444', background: 'transparent',
            color: '#ff4444', cursor: 'pointer', fontSize: '0.9rem',
            fontFamily: "'Jua', sans-serif",
          }}>삭제</button>
        )}

        {/* 댓글 섹션 */}
        <PatchCommentSection patchId={selectedPatch.id} profile={profile} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0, fontSize: '1.2rem' }}>📋 패치노트</h3>
        {isAdmin && (
          <button onClick={() => setShowWrite(!showWrite)} style={{
            padding: '8px 16px', borderRadius: '8px',
            border: '1px solid #4a7c3f', background: showWrite ? 'rgba(74,124,63,0.4)' : 'rgba(74,124,63,0.2)',
            color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
            fontFamily: "'Jua', sans-serif",
          }}>
            {showWrite ? '▲ 닫기' : '✏️ 작성'}
          </button>
        )}
      </div>

      {/* 작성 폼 - 관리자만 */}
      {isAdmin && showWrite && (
        <div style={{
          background: 'rgba(74,124,63,0.1)', border: '1px solid #4a7c3f',
          borderRadius: '12px', padding: '16px', marginBottom: '16px',
        }}>
          <input
            placeholder="버전 (예: v1.1)"
            value={version}
            onChange={e => setVersion(e.target.value)}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '1rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          <input
            placeholder="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '1rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          <textarea
            placeholder="패치 내용을 입력해주세요..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={6}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.95rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <button onClick={handleWrite} style={{
            marginTop: '8px', padding: '10px 24px', borderRadius: '8px',
            border: 'none', background: '#4a7c3f',
            color: '#fff', cursor: 'pointer', fontSize: '1rem',
            fontFamily: "'Jua', sans-serif",
          }}>등록</button>
        </div>
      )}

      {/* 패치노트 목록 */}
      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>로딩중...</div>
      ) : patches.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>패치노트가 없습니다.</div>
      ) : (
        <div>
          {patches.map((patch, i) => (
            <div
              key={patch.id}
              onClick={() => setSelectedPatch(patch)}
              style={{
                padding: '14px 16px',
                borderBottom: i < patches.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none',
                cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    background: 'rgba(74,124,63,0.4)', border: '1px solid #4a7c3f',
                    borderRadius: '6px', padding: '2px 8px', color: '#7ae8ff', fontSize: '0.8rem',
                  }}>{patch.version}</span>
                  <span style={{ color: '#fff', fontSize: '1rem' }}>{patch.title}</span>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                  {new Date(patch.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentSection({ postId, profile }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, users(nickname)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setComments(data || []);
    };
    fetchComments();
  }, [postId]);

  const refreshComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, users(nickname)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };
  
  const handleAddComment = async () => {
    if (!commentText.trim()) { alert('댓글을 입력해주세요!'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: session.user.id,
      content: commentText.trim(),
    });
    if (error) { alert('댓글 작성 실패했어요.'); return; }
    setCommentText('');
    refreshComments();
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    await supabase.from('comments').delete().eq('id', commentId);
    refreshComments();
  };

  return (
    <div style={{ borderTop: '1px solid #4a7c3f', paddingTop: '16px', marginTop: '16px' }}>
      <h4 style={{ color: '#f5c842', margin: '0 0 16px', fontSize: '1rem' }}>
        💬 댓글 {comments.length}개
      </h4>
      {comments.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>첫 댓글을 남겨보세요!</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px', padding: '12px', marginBottom: '8px',
              border: '1px solid rgba(74,124,63,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: '#f5c842', fontSize: '0.85rem' }}>{comment.users?.nickname}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {comment.user_id === profile.id && (
                    <button onClick={() => handleDeleteComment(comment.id)} style={{
                      padding: '2px 8px', borderRadius: '4px',
                      border: '1px solid #ff4444', background: 'transparent',
                      color: '#ff4444', cursor: 'pointer', fontSize: '0.75rem',
                      fontFamily: "'Jua', sans-serif",
                    }}>삭제</button>
                  )}
                </div>
              </div>
              <p style={{ color: '#ddd', fontSize: '0.9rem', margin: 0 }}>{comment.content}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          placeholder="댓글을 입력해주세요..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddComment()}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: '0.9rem', outline: 'none',
            fontFamily: "'Jua', sans-serif",
          }}
        />
        <button onClick={handleAddComment} style={{
          padding: '10px 20px', borderRadius: '8px',
          border: 'none', background: '#4a7c3f',
          color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
          fontFamily: "'Jua', sans-serif",
        }}>등록</button>
      </div>
    </div>
  );
}

function PatchCommentSection({ patchId, profile }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('patch_comments')
        .select('*, users(nickname)')
        .eq('patch_id', patchId)
        .order('created_at', { ascending: true });
      setComments(data || []);
    };
    fetchComments();
  }, [patchId]);

  const refreshComments = async () => {
    const { data } = await supabase
      .from('patch_comments')
      .select('*, users(nickname)')
      .eq('patch_id', patchId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) { alert('댓글을 입력해주세요!'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('patch_comments').insert({
      patch_id: patchId,
      user_id: user.id,
      content: commentText.trim(),
    });
    if (error) { alert('댓글 작성 실패했어요.'); return; }
    setCommentText('');
    refreshComments();
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    await supabase.from('patch_comments').delete().eq('id', commentId);
    refreshComments();
  };

  return (
    <div style={{ borderTop: '1px solid #4a7c3f', paddingTop: '16px', marginTop: '16px' }}>
      <h4 style={{ color: '#f5c842', margin: '0 0 16px', fontSize: '1rem' }}>
        💬 댓글 {comments.length}개
      </h4>
      {comments.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>첫 댓글을 남겨보세요!</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px', padding: '12px', marginBottom: '8px',
              border: '1px solid rgba(74,124,63,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: '#f5c842', fontSize: '0.85rem' }}>{comment.users?.nickname}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {comment.user_id === profile.id && (
                    <button onClick={() => handleDeleteComment(comment.id)} style={{
                      padding: '2px 8px', borderRadius: '4px',
                      border: '1px solid #ff4444', background: 'transparent',
                      color: '#ff4444', cursor: 'pointer', fontSize: '0.75rem',
                      fontFamily: "'Jua', sans-serif",
                    }}>삭제</button>
                  )}
                </div>
              </div>
              <p style={{ color: '#ddd', fontSize: '0.9rem', margin: 0 }}>{comment.content}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          placeholder="댓글을 입력해주세요..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddComment()}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: '0.9rem', outline: 'none',
            fontFamily: "'Jua', sans-serif",
          }}
        />
        <button onClick={handleAddComment} style={{
          padding: '10px 20px', borderRadius: '8px',
          border: 'none', background: '#4a7c3f',
          color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
          fontFamily: "'Jua', sans-serif",
        }}>등록</button>
      </div>
    </div>
  );
}

// 게시판 탭
function BoardTab({ profile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWrite, setShowWrite] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, users(nickname)')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const handleWrite = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요!'); return; }
    if (!content.trim()) { alert('내용을 입력해주세요!'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });

    if (error) { alert('글 작성 실패했어요.'); return; }
    setTitle('');
    setContent('');
    setShowWrite(false);
    fetchPosts();
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제할까요?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    setSelectedPost(null);
    fetchPosts();
  };
  const [editPost, setEditPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleEdit = async () => {
    if (!editTitle.trim()) { alert('제목을 입력해주세요!'); return; }
    if (!editContent.trim()) { alert('내용을 입력해주세요!'); return; }

    const { error } = await supabase
      .from('posts')
      .update({ title: editTitle.trim(), content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', selectedPost.id);

    if (error) { alert('수정 실패했어요.'); return; }
    alert('수정됐어요! 👍');
    setEditPost(false);
    fetchPosts();
    setSelectedPost({ ...selectedPost, title: editTitle, content: editContent });
  };

// 글 상세보기
  if (selectedPost) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
        borderRadius: '16px', padding: '24px',
      }}>
        <button onClick={() => { setSelectedPost(null); setEditPost(false); }} style={{
          padding: '6px 16px', borderRadius: '8px',
          border: '1px solid #4a7c3f', background: 'transparent',
          color: '#aaa', cursor: 'pointer', fontSize: '0.9rem',
          fontFamily: "'Jua', sans-serif", marginBottom: '16px',
        }}>← 목록으로</button>

        <h2 style={{ color: '#f5c842', margin: '0 0 8px' }}>{selectedPost.title}</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 24px' }}>
          {selectedPost.users?.nickname} · {new Date(selectedPost.created_at).toLocaleDateString('ko-KR')}
        </p>
        <div style={{
          color: '#ddd', fontSize: '1rem', lineHeight: '1.8',
          borderTop: '1px solid #4a7c3f', paddingTop: '16px', marginBottom: '24px',
          whiteSpace: 'pre-wrap',
        }}>
          {selectedPost.content}
        </div>

        {selectedPost.user_id === profile.id && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => {
              setEditPost(!editPost);
              setEditTitle(selectedPost.title);
              setEditContent(selectedPost.content);
            }} style={{
              padding: '8px 20px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'transparent',
              color: '#4a7c3f', cursor: 'pointer', fontSize: '0.9rem',
              fontFamily: "'Jua', sans-serif",
            }}>수정</button>
            <button onClick={() => handleDelete(selectedPost.id)} style={{
              padding: '8px 20px', borderRadius: '8px',
              border: '1px solid #ff4444', background: 'transparent',
              color: '#ff4444', cursor: 'pointer', fontSize: '0.9rem',
              fontFamily: "'Jua', sans-serif",
            }}>삭제</button>
          </div>
        )}

        {editPost && (
          <div style={{
            background: 'rgba(74,124,63,0.1)', border: '1px solid #4a7c3f',
            borderRadius: '12px', padding: '16px', marginBottom: '16px',
          }}>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '1rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", marginBottom: '8px',
              boxSizing: 'border-box',
            }} />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.95rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", resize: 'vertical',
              boxSizing: 'border-box',
            }} />
            <button onClick={handleEdit} style={{
              marginTop: '8px', padding: '10px 24px', borderRadius: '8px',
              border: 'none', background: '#4a7c3f',
              color: '#fff', cursor: 'pointer', fontSize: '1rem',
              fontFamily: "'Jua', sans-serif",
            }}>저장</button>
          </div>
        )}

        {/* 댓글 섹션 */}
        <CommentSection postId={selectedPost.id} profile={profile} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0, fontSize: '1.2rem' }}>💬 자유게시판</h3>
        <button onClick={() => setShowWrite(!showWrite)} style={{
          padding: '8px 16px', borderRadius: '8px',
          border: '1px solid #4a7c3f', background: showWrite ? 'rgba(74,124,63,0.4)' : 'rgba(74,124,63,0.2)',
          color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
          fontFamily: "'Jua', sans-serif",
        }}>
          {showWrite ? '▲ 닫기' : '✏️ 글쓰기'}
        </button>
      </div>

      {/* 글쓰기 폼 */}
      {showWrite && (
        <div style={{
          background: 'rgba(74,124,63,0.1)', border: '1px solid #4a7c3f',
          borderRadius: '12px', padding: '16px', marginBottom: '16px',
        }}>
          <input
            placeholder="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '1rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          <textarea
            placeholder="내용을 입력해주세요..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.95rem', outline: 'none',
              fontFamily: "'Jua', sans-serif", resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <button onClick={handleWrite} style={{
            marginTop: '8px', padding: '10px 24px', borderRadius: '8px',
            border: 'none', background: '#4a7c3f',
            color: '#fff', cursor: 'pointer', fontSize: '1rem',
            fontFamily: "'Jua', sans-serif",
          }}>등록</button>
        </div>
      )}

      {/* 글 목록 */}
      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>로딩중...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>게시글이 없습니다.</div>
      ) : (
        <div>
          {posts.map((post, i) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              style={{
                padding: '14px 16px',
                borderBottom: i < posts.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '1rem' }}>{post.title}</span>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{post.users?.nickname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 접속유저 탭
function OnlineTab() {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    fetchOnlineUsers();

    // 5분 이상 last_seen 없으면 오프라인으로 간주하고 5초마다 갱신
    const interval = setInterval(fetchOnlineUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('online_users')
      .select('*')
      .gte('last_seen', fiveMinAgo)
      .order('last_seen', { ascending: false });
    setOnlineUsers(data || []);
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px',
    }}>
      <h3 style={{ color: '#f5c842', margin: '0 0 16px', fontSize: '1.2rem' }}>
        🟢 접속중인 유저 ({onlineUsers.length}명)
      </h3>
      {onlineUsers.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
          접속중인 유저가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {onlineUsers.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(74,124,63,0.15)', border: '1px solid #4a7c3f',
              borderRadius: '20px', padding: '8px 16px',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#4cff72', boxShadow: '0 0 6px #4cff72',
              }} />
              <span style={{ color: '#fff', fontSize: '0.95rem' }}>{user.nickname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Main;