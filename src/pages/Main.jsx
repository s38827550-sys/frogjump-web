import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, clearToken } from '../apiClient';
import bg from '../assets/background_mygame2.png';
import frogNormal from '../assets/frog_normal.PNG';

const TABS = ['홈', '랭킹', '패치노트', '게시판', '공지사항', '이벤트', '문의', '접속유저'];

function Main() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('홈');
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    const fetchProfile = async () => {
      const res = await api('GET', '/users/me', null, token);
      if (!res) return;
      const data = await res.json();
      setProfile(data);
    };
    fetchProfile();

    // 접속유저 heartbeat (30초마다)
    const heartbeat = setInterval(() => {
      api('POST', '/users/online', null, token);
    }, 30000);
    api('POST', '/users/online', null, token);

    return () => clearInterval(heartbeat);
  }, [token, navigate]);

  const handleLogout = async () => {
    await api('DELETE', '/users/online', null, token);
    clearToken();
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
      backgroundAttachment: 'fixed', fontFamily: "'Jua', sans-serif",
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f5c842', fontSize: '1.4rem' }}>
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
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 24px', borderRadius: '8px',
            border: activeTab === tab ? '1px solid #4a7c3f' : '1px solid transparent',
            background: activeTab === tab ? 'rgba(74,124,63,0.5)' : 'transparent',
            color: activeTab === tab ? '#f5c842' : '#888',
            cursor: 'pointer', fontSize: '1rem',
            fontFamily: "'Jua', sans-serif",
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1200px', margin: '0 auto',
        padding: '124px 24px 40px',
      }}>
        {activeTab === '홈' && <HomeTab profile={profile} setProfile={setProfile} token={token} />}
        {activeTab === '랭킹' && <RankingTab token={token} />}
        {activeTab === '패치노트' && <PatchTab profile={profile} token={token} />}
        {activeTab === '게시판' && <BoardTab profile={profile} token={token} />}
        {activeTab === '공지사항' && <NoticeTab profile={profile} token={token} />}
        {activeTab === '이벤트' && <EventTab profile={profile} token={token} />}
        {activeTab === '문의' && <InquiryTab profile={profile} token={token} />}
        {activeTab === '접속유저' && <OnlineTab token={token} />}
      </div>
    </div>
  );
}

// ── 홈 탭 ────────────────────────────────────────────────
function HomeTab({ profile, setProfile, token }) {
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname);
  const [bestScore, setBestScore] = useState(0);
  const [attended, setAttended] = useState(false);

  useEffect(() => {
    const fetchScores = async () => {
      const res = await api('GET', '/leaderboard?page=1&size=100', null, token);
      if (!res) return;
      const data = await res.json();
      const mine = data.items?.find(r => r.username === profile.username);
      if (mine) setBestScore(mine.score);
    };
    fetchScores();

    const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (profile.last_attendance === today) setAttended(true);
  }, [profile, token]);

  const handleAttendance = async () => {
    const res = await api('POST', '/users/me/attendance', null, token);
    if (!res) return;
    if (res.ok) {
      setAttended(true);
      const profileRes = await api('GET', '/users/me', null, token);
      if (profileRes) setProfile(await profileRes.json());
      alert('출석체크 완료! +3 포인트 획득 🎉');
    } else {
      const data = await res.json();
      alert(data.detail || '출석체크 실패');
    }
  };

  const handleSaveNickname = async () => {
    if (nickname === profile.nickname) { alert('닉네임이 같아요!'); return; }
    const res = await api('PATCH', '/users/me/nickname', { nickname }, token);
    if (!res) return;
    if (res.ok) {
      const profileRes = await api('GET', '/users/me', null, token);
      if (profileRes) setProfile(await profileRes.json());
      setEditMode(false);
      alert('닉네임이 변경됐어요! 🐸');
    } else {
      const data = await res.json();
      alert(data.detail || '변경 실패');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말 탈퇴하실 건가요?')) return;
    const res = await api('DELETE', '/users/me', null, token);
    if (res?.ok) {
      clearToken();
      alert('탈퇴가 완료됐어요 🐸');
      window.location.href = '/login';
    }
  };

  const handleDownload = () => {
    window.open('https://github.com/s38827550-sys/FrogJumpGame/releases/download/v1.2.3/FrogJump_v1.2.3.zip', '_blank');
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div style={{ width: '300px', flexShrink: 0 }}>
        {/* 게임 다운로드 */}
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
          }}>🎮 게임 다운로드</button>
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
              <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>역대 최고: <span style={{ color: '#7ae8ff' }}>{bestScore}점</span></p>
              <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>포인트: <span style={{ color: '#7ae8ff' }}>{profile.points || 0}</span></p>
            </div>
          </div>

          <button onClick={() => setEditMode(!editMode)} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            border: '1px solid #4a7c3f', background: 'transparent',
            color: '#ccc', cursor: 'pointer', fontSize: '0.95rem',
            fontFamily: "'Jua', sans-serif", marginBottom: '8px',
          }}>
            {editMode ? '▲ 닫기' : '✏️ 프로필 수정'}
          </button>

          {editMode && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ color: '#f5c842', fontSize: '0.8rem', margin: '0 0 8px' }}>⚠️ 닉네임 변경 시 100포인트 차감</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
            border: '1px solid #ff4444', background: 'transparent',
            color: '#ff4444', cursor: 'pointer', fontSize: '0.95rem',
            fontFamily: "'Jua', sans-serif",
          }}>회원탈퇴</button>
        </div>

        {/* 출석체크 */}
        <div style={{
          background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
          borderRadius: '16px', padding: '20px', marginTop: '16px',
        }}>
          <h4 style={{ color: '#f5c842', margin: '0 0 12px' }}>📅 출석체크</h4>
          <button onClick={handleAttendance} disabled={attended} style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px solid #4a7c3f',
            background: attended ? 'rgba(74,124,63,0.2)' : 'rgba(74,124,63,0.5)',
            color: attended ? '#888' : '#fff',
            cursor: attended ? 'default' : 'pointer',
            fontSize: '1rem', fontFamily: "'Jua', sans-serif",
          }}>
            {attended ? '✅ 오늘 출석 완료' : '출석체크 (+3포인트)'}
          </button>
        </div>
      </div>

      {/* 랭킹 요약 */}
      <RankingSummary token={token} />
    </div>
  );
}

function RankingSummary({ token }) {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await api('GET', '/leaderboard?page=1&size=5', null, token);
      if (!res) return;
      const data = await res.json();
      setRankings(data.items || []);
    };
    fetch();
  }, [token]);

  return (
    <div style={{
      flex: 1, background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px', minHeight: '400px',
    }}>
      <h3 style={{ color: '#f5c842', margin: '0 0 16px' }}>🏆 랭킹보드 TOP 5</h3>
      {rankings.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', paddingTop: '60px' }}>랭킹 데이터가 없습니다.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(74,124,63,0.2)' }}>
                <td style={{ color: i === 0 ? '#f5c842' : i === 1 ? '#ccc' : i === 2 ? '#cd7f32' : '#888', padding: '10px', textAlign: 'center', width: '40px' }}>
                  {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td style={{ color: '#fff', padding: '10px' }}>{r.username}</td>
                <td style={{ color: '#f5c842', padding: '10px', textAlign: 'right' }}>{r.score}점</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── 랭킹 탭 ─────────────────────────────────────────────
function RankingTab({ token }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      const res = await api('GET', `/leaderboard?page=${page}&size=20`, null, token);
      if (!res) return;
      const data = await res.json();
      setRankings(data.items || []);
      setTotal(data.total || 0);
      setLoading(false);
    };
    fetchRankings();
  }, [token, page]);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
      borderRadius: '16px', padding: '24px',
    }}>
      <h3 style={{ color: '#f5c842', margin: '0 0 16px' }}>🏆 전체 랭킹</h3>
      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>로딩중...</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #4a7c3f' }}>
                <th style={{ color: '#aaa', padding: '8px', textAlign: 'center', width: '60px' }}>순위</th>
                <th style={{ color: '#aaa', padding: '8px', textAlign: 'left' }}>유저</th>
                <th style={{ color: '#aaa', padding: '8px', textAlign: 'right' }}>점수</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.rank} style={{ borderBottom: '1px solid rgba(74,124,63,0.2)' }}>
                  <td style={{ color: r.rank === 1 ? '#f5c842' : r.rank === 2 ? '#ccc' : r.rank === 3 ? '#cd7f32' : '#888', padding: '10px', textAlign: 'center' }}>
                    {r.rank === 1 ? '🏆' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                  </td>
                  <td style={{ color: '#fff', padding: '10px' }}>{r.username}</td>
                  <td style={{ color: '#f5c842', padding: '10px', textAlign: 'right' }}>{r.score}점</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn}>이전</button>
            <span style={{ color: '#aaa', padding: '8px' }}>{page} / {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} style={pageBtn}>다음</button>
          </div>
        </>
      )}
    </div>
  );
}

const pageBtn = {
  padding: '8px 16px', borderRadius: '8px',
  border: '1px solid #4a7c3f', background: 'transparent',
  color: '#fff', cursor: 'pointer', fontFamily: "'Jua', sans-serif",
};

// ── 패치노트 탭 ──────────────────────────────────────────
function PatchTab({ profile, token }) {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', version: '' });
  const [comment, setComment] = useState('');
  const isAdmin = profile?.role === 'admin';

  const fetchPatches = useCallback(async () => {
    const res = await api('GET', '/patch-notes', null, token);
    if (!res) return;
    const data = await res.json();
    setPatches(data.items || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchPatches(); }, [fetchPatches]);

  const handleWrite = async () => {
    const res = await api('POST', '/patch-notes', form, token);
    if (!res) return;
    if (res.ok) { setForm({ title: '', content: '', version: '' }); setShowWrite(false); fetchPatches(); }
    else { const d = await res.json(); alert(d.detail || '작성 실패'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return;
    const res = await api('DELETE', `/patch-notes/${id}`, null, token);
    if (res?.ok) { setSelected(null); fetchPatches(); }
  };

  const handleComment = async (patchId) => {
    if (!comment.trim()) return;
    const res = await api('POST', `/patch-notes/${patchId}/comments`, { content: comment }, token);
    if (res?.ok) {
      setComment('');
      const r = await api('GET', `/patch-notes/${patchId}`, null, token);
      if (r) setSelected(await r.json());
    }
  };

  const handleDeleteComment = async (patchId, commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    const res = await api('DELETE', `/patch-notes/${patchId}/comments/${commentId}`, null, token);
    if (res?.ok) {
      const r = await api('GET', `/patch-notes/${patchId}`, null, token);
      if (r) setSelected(await r.json());
    }
  };

  if (selected) return (
    <div style={cardStyle}>
      <button onClick={() => setSelected(null)} style={backBtn}>← 목록으로</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ background: 'rgba(74,124,63,0.4)', border: '1px solid #4a7c3f', borderRadius: '6px', padding: '2px 10px', color: '#7ae8ff', fontSize: '0.85rem' }}>{selected.version}</span>
        <h2 style={{ color: '#f5c842', margin: 0 }}>{selected.title}</h2>
      </div>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 16px' }}>{new Date(selected.created_at).toLocaleDateString('ko-KR')}</p>
      <div style={{ color: '#ddd', lineHeight: '1.8', borderTop: '1px solid #4a7c3f', paddingTop: '16px', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{selected.content}</div>
      {isAdmin && <button onClick={() => handleDelete(selected.id)} style={dangerBtn}>삭제</button>}
      <CommentSection comments={selected.comments || []} onAdd={(c) => handleComment(selected.id)} onDelete={(cid) => handleDeleteComment(selected.id, cid)} comment={comment} setComment={setComment} profile={profile} />
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0 }}>📋 패치노트</h3>
        {isAdmin && <button onClick={() => setShowWrite(!showWrite)} style={writeBtn}>{showWrite ? '▲ 닫기' : '✏️ 작성'}</button>}
      </div>
      {isAdmin && showWrite && (
        <div style={formStyle}>
          <input placeholder="버전 (예: v1.2)" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} style={inputStyle} />
          <input placeholder="제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="내용" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          <button onClick={handleWrite} style={submitBtn}>등록</button>
        </div>
      )}
      {loading ? <div style={loadingStyle}>로딩중...</div> : patches.length === 0 ? <div style={emptyStyle}>패치노트가 없습니다.</div> : (
        <div>
          {patches.map((p, i) => (
            <div key={p.id} onClick={async () => { const r = await api('GET', `/patch-notes/${p.id}`, null, token); if (r) setSelected(await r.json()); }}
              style={{ ...listItem, borderBottom: i < patches.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'rgba(74,124,63,0.4)', border: '1px solid #4a7c3f', borderRadius: '6px', padding: '2px 8px', color: '#7ae8ff', fontSize: '0.8rem' }}>{p.version}</span>
                  <span style={{ color: '#fff' }}>{p.title}</span>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 게시판 탭 ────────────────────────────────────────────
function BoardTab({ profile, token }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [comment, setComment] = useState('');

  const fetchPosts = useCallback(async () => {
    const res = await api('GET', '/posts', null, token);
    if (!res) return;
    const data = await res.json();
    setPosts(data.items || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleWrite = async () => {
    const res = await api('POST', '/posts', form, token);
    if (res?.ok) { setForm({ title: '', content: '' }); setShowWrite(false); fetchPosts(); }
    else { const d = await res.json(); alert(d.detail || '작성 실패'); }
  };

  const handleEdit = async () => {
    const res = await api('PATCH', `/posts/${selected.id}`, editForm, token);
    if (res?.ok) {
      setEditMode(false);
      const r = await api('GET', `/posts/${selected.id}`, null, token);
      if (r) setSelected(await r.json());
      fetchPosts();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return;
    const res = await api('DELETE', `/posts/${id}`, null, token);
    if (res?.ok) { setSelected(null); fetchPosts(); }
  };

  const handleComment = async (postId) => {
    if (!comment.trim()) return;
    const res = await api('POST', `/posts/${postId}/comments`, { content: comment }, token);
    if (res?.ok) {
      setComment('');
      const r = await api('GET', `/posts/${postId}`, null, token);
      if (r) setSelected(await r.json());
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('삭제할까요?')) return;
    const res = await api('DELETE', `/posts/${postId}/comments/${commentId}`, null, token);
    if (res?.ok) {
      const r = await api('GET', `/posts/${postId}`, null, token);
      if (r) setSelected(await r.json());
    }
  };

  if (selected) return (
    <div style={cardStyle}>
      <button onClick={() => { setSelected(null); setEditMode(false); }} style={backBtn}>← 목록으로</button>
      <h2 style={{ color: '#f5c842', margin: '0 0 8px' }}>{selected.title}</h2>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 16px' }}>{selected.nickname} · {new Date(selected.created_at).toLocaleDateString('ko-KR')}</p>
      <div style={{ color: '#ddd', lineHeight: '1.8', borderTop: '1px solid #4a7c3f', paddingTop: '16px', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{selected.content}</div>
      {(selected.username === profile.username || profile.role === 'admin') && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {selected.username === profile.username && (
            <button onClick={() => { setEditMode(!editMode); setEditForm({ title: selected.title, content: selected.content }); }} style={writeBtn}>수정</button>
          )}
          <button onClick={() => handleDelete(selected.id)} style={dangerBtn}>삭제</button>
        </div>
      )}
      {editMode && (
        <div style={{ ...formStyle, marginBottom: '16px' }}>
          <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          <button onClick={handleEdit} style={submitBtn}>저장</button>
        </div>
      )}
      <CommentSection comments={selected.comments || []} onAdd={() => handleComment(selected.id)} onDelete={(cid) => handleDeleteComment(selected.id, cid)} comment={comment} setComment={setComment} profile={profile} />
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0 }}>💬 자유게시판</h3>
        <button onClick={() => setShowWrite(!showWrite)} style={writeBtn}>{showWrite ? '▲ 닫기' : '✏️ 글쓰기'}</button>
      </div>
      {showWrite && (
        <div style={formStyle}>
          <input placeholder="제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="내용" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          <button onClick={handleWrite} style={submitBtn}>등록</button>
        </div>
      )}
      {loading ? <div style={loadingStyle}>로딩중...</div> : posts.length === 0 ? <div style={emptyStyle}>게시글이 없습니다.</div> : (
        <div>
          {posts.map((p, i) => (
            <div key={p.id} onClick={async () => { const r = await api('GET', `/posts/${p.id}`, null, token); if (r) setSelected(await r.json()); }}
              style={{ ...listItem, borderBottom: i < posts.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#fff' }}>{p.title} <span style={{ color: '#888', fontSize: '0.8rem' }}>({p.comment_count})</span></span>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{p.nickname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 공지사항 탭 ──────────────────────────────────────────
function NoticeTab({ profile, token }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', importance: 'normal', is_pinned: false });
  const isAdmin = profile?.role === 'admin';

  const fetchNotices = useCallback(async () => {
    const res = await api('GET', '/notices', null, token);
    if (!res) return;
    const data = await res.json();
    setNotices(data.items || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handleWrite = async () => {
    const res = await api('POST', '/notices', form, token);
    if (res?.ok) { setForm({ title: '', content: '', importance: 'normal', is_pinned: false }); setShowWrite(false); fetchNotices(); }
    else { const d = await res.json(); alert(d.detail || '작성 실패'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return;
    const res = await api('DELETE', `/notices/${id}`, null, token);
    if (res?.ok) { setSelected(null); fetchNotices(); }
  };

  const handleReaction = async (noticeId, reaction) => {
    await api('POST', `/notices/${noticeId}/reactions`, { reaction }, token);
    const r = await api('GET', `/notices/${noticeId}`, null, token);
    if (r) setSelected(await r.json());
  };

  const importanceColor = (imp) => imp === 'urgent' ? '#ff4444' : imp === 'important' ? '#f5c842' : '#aaa';
  const importanceLabel = (imp) => imp === 'urgent' ? '🚨 긴급' : imp === 'important' ? '⚠️ 중요' : '📢 일반';

  if (selected) return (
    <div style={cardStyle}>
      <button onClick={() => setSelected(null)} style={backBtn}>← 목록으로</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ color: importanceColor(selected.importance), fontSize: '0.9rem' }}>{importanceLabel(selected.importance)}</span>
        {selected.is_pinned && <span style={{ color: '#f5c842' }}>📌</span>}
        <h2 style={{ color: '#f5c842', margin: 0 }}>{selected.title}</h2>
      </div>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 16px' }}>{new Date(selected.created_at).toLocaleDateString('ko-KR')}</p>
      <div style={{ color: '#ddd', lineHeight: '1.8', borderTop: '1px solid #4a7c3f', paddingTop: '16px', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{selected.content}</div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => handleReaction(selected.id, 'like')} style={{ ...writeBtn }}>👍 {selected.likes || 0}</button>
        <button onClick={() => handleReaction(selected.id, 'dislike')} style={{ ...writeBtn }}>👎 {selected.dislikes || 0}</button>
      </div>
      {isAdmin && <button onClick={() => handleDelete(selected.id)} style={dangerBtn}>삭제</button>}
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0 }}>📢 공지사항</h3>
        {isAdmin && <button onClick={() => setShowWrite(!showWrite)} style={writeBtn}>{showWrite ? '▲ 닫기' : '✏️ 작성'}</button>}
      </div>
      {isAdmin && showWrite && (
        <div style={formStyle}>
          <input placeholder="제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="내용" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          <select value={form.importance} onChange={e => setForm(p => ({ ...p, importance: e.target.value }))} style={{ ...inputStyle, background: 'rgba(0,0,0,0.5)' }}>
            <option value="normal">📢 일반</option>
            <option value="important">⚠️ 중요</option>
            <option value="urgent">🚨 긴급</option>
          </select>
          <label style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))} />
            📌 상단 고정
          </label>
          <button onClick={handleWrite} style={submitBtn}>등록</button>
        </div>
      )}
      {loading ? <div style={loadingStyle}>로딩중...</div> : notices.length === 0 ? <div style={emptyStyle}>공지사항이 없습니다.</div> : (
        <div>
          {notices.map((n, i) => (
            <div key={n.id} onClick={async () => { const r = await api('GET', `/notices/${n.id}`, null, token); if (r) setSelected(await r.json()); }}
              style={{ ...listItem, borderBottom: i < notices.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none', background: n.is_pinned ? 'rgba(245,200,66,0.05)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = n.is_pinned ? 'rgba(245,200,66,0.05)' : 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {n.is_pinned && <span>📌</span>}
                  <span style={{ color: importanceColor(n.importance), fontSize: '0.8rem' }}>{importanceLabel(n.importance)}</span>
                  <span style={{ color: '#fff' }}>{n.title}</span>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 이벤트 탭 ────────────────────────────────────────────
function EventTab({ profile, token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', start_date: '', end_date: '' });
  const isAdmin = profile?.role === 'admin';

  const fetchEvents = useCallback(async () => {
    const res = await api('GET', '/events', null, token);
    if (!res) return;
    const data = await res.json();
    setEvents(data.items || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleWrite = async () => {
    const res = await api('POST', '/events', form, token);
    if (res?.ok) { setForm({ title: '', content: '', start_date: '', end_date: '' }); setShowWrite(false); fetchEvents(); }
    else { const d = await res.json(); alert(d.detail || '작성 실패'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return;
    const res = await api('DELETE', `/events/${id}`, null, token);
    if (res?.ok) { setSelected(null); fetchEvents(); }
  };

  const statusColor = (s) => s === '진행중' ? '#4cff72' : s === '예정' ? '#7ae8ff' : '#888';

  if (selected) return (
    <div style={cardStyle}>
      <button onClick={() => setSelected(null)} style={backBtn}>← 목록으로</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ background: `${statusColor(selected.status)}22`, border: `1px solid ${statusColor(selected.status)}`, borderRadius: '6px', padding: '2px 10px', color: statusColor(selected.status), fontSize: '0.85rem' }}>{selected.status}</span>
        <h2 style={{ color: '#f5c842', margin: 0 }}>{selected.title}</h2>
      </div>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 16px' }}>
        📅 {new Date(selected.start_date).toLocaleDateString('ko-KR')} ~ {new Date(selected.end_date).toLocaleDateString('ko-KR')}
      </p>
      <div style={{ color: '#ddd', lineHeight: '1.8', borderTop: '1px solid #4a7c3f', paddingTop: '16px', whiteSpace: 'pre-wrap' }}>{selected.content}</div>
      {isAdmin && <button onClick={() => handleDelete(selected.id)} style={{ ...dangerBtn, marginTop: '16px' }}>삭제</button>}
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0 }}>🎉 이벤트</h3>
        {isAdmin && <button onClick={() => setShowWrite(!showWrite)} style={writeBtn}>{showWrite ? '▲ 닫기' : '✏️ 작성'}</button>}
      </div>
      {isAdmin && showWrite && (
        <div style={formStyle}>
          <input placeholder="제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="내용" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 4px' }}>시작일</p>
              <input type="datetime-local" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 4px' }}>종료일</p>
              <input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={handleWrite} style={submitBtn}>등록</button>
        </div>
      )}
      {loading ? <div style={loadingStyle}>로딩중...</div> : events.length === 0 ? <div style={emptyStyle}>이벤트가 없습니다.</div> : (
        <div>
          {events.map((e, i) => (
            <div key={e.id} onClick={async () => { const r = await api('GET', `/events/${e.id}`, null, token); if (r) setSelected(await r.json()); }}
              style={{ ...listItem, borderBottom: i < events.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none' }}
              onMouseEnter={el => el.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: `${statusColor(e.status)}22`, border: `1px solid ${statusColor(e.status)}`, borderRadius: '6px', padding: '2px 8px', color: statusColor(e.status), fontSize: '0.8rem' }}>{e.status}</span>
                  <span style={{ color: '#fff' }}>{e.title}</span>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(e.end_date).toLocaleDateString('ko-KR')} 까지</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 문의 탭 ──────────────────────────────────────────────
function InquiryTab({ profile, token }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [chatMsg, setChatMsg] = useState('');
  const isAdmin = profile?.role === 'admin';

  const fetchInquiries = useCallback(async () => {
    const res = await api('GET', '/inquiries', null, token);
    if (!res) return;
    const data = await res.json();
    setInquiries(data.items || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleWrite = async () => {
    const res = await api('POST', '/inquiries', form, token);
    if (res?.ok) { setForm({ title: '', content: '' }); setShowWrite(false); fetchInquiries(); }
    else { const d = await res.json(); alert(d.detail || '작성 실패'); }
  };

  const handleChat = async () => {
    if (!chatMsg.trim()) return;
    const res = await api('POST', `/inquiries/${selected.id}/chat`, { message: chatMsg }, token);
    if (res?.ok) {
      setChatMsg('');
      const r = await api('GET', `/inquiries/${selected.id}`, null, token);
      if (r) setSelected(await r.json());
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return;
    const res = await api('DELETE', `/inquiries/${id}`, null, token);
    if (res?.ok) { setSelected(null); fetchInquiries(); }
  };

  if (selected) return (
    <div style={cardStyle}>
      <button onClick={() => { setSelected(null); }} style={backBtn}>← 목록으로</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{
          background: selected.status === '답변완료' ? 'rgba(76,255,114,0.2)' : 'rgba(245,200,66,0.2)',
          border: `1px solid ${selected.status === '답변완료' ? '#4cff72' : '#f5c842'}`,
          borderRadius: '6px', padding: '2px 10px',
          color: selected.status === '답변완료' ? '#4cff72' : '#f5c842', fontSize: '0.85rem',
        }}>{selected.status}</span>
        <h2 style={{ color: '#f5c842', margin: 0 }}>{selected.title}</h2>
      </div>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 16px' }}>{new Date(selected.created_at).toLocaleDateString('ko-KR')}</p>
      <div style={{ color: '#ddd', lineHeight: '1.8', borderTop: '1px solid #4a7c3f', paddingTop: '16px', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{selected.content}</div>

      {/* 채팅 메시지 */}
      {selected.answer && (
        <div style={{ background: 'rgba(74,124,63,0.1)', border: '1px solid #4a7c3f', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ color: '#4cff72', fontSize: '0.9rem', margin: '0 0 8px' }}>💬 대화 내역</p>
          <p style={{ color: '#ddd', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{selected.answer}</p>
        </div>
      )}

      {/* 채팅 입력 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input placeholder="메시지 입력..." value={chatMsg} onChange={e => setChatMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleChat()}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: "'Jua', sans-serif" }} />
        <button onClick={handleChat} style={submitBtn}>전송</button>
      </div>

      {(selected.username === profile.username || isAdmin) && (
        <button onClick={() => handleDelete(selected.id)} style={dangerBtn}>삭제</button>
      )}
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f5c842', margin: 0 }}>📩 1:1 문의</h3>
        <button onClick={() => setShowWrite(!showWrite)} style={writeBtn}>{showWrite ? '▲ 닫기' : '✏️ 문의하기'}</button>
      </div>
      {showWrite && (
        <div style={formStyle}>
          <input placeholder="제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="문의 내용" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          <button onClick={handleWrite} style={submitBtn}>등록</button>
        </div>
      )}
      {loading ? <div style={loadingStyle}>로딩중...</div> : inquiries.length === 0 ? <div style={emptyStyle}>문의 내역이 없습니다.</div> : (
        <div>
          {inquiries.map((inq, i) => (
            <div key={inq.id} onClick={async () => { const r = await api('GET', `/inquiries/${inq.id}`, null, token); if (r) setSelected(await r.json()); }}
              style={{ ...listItem, borderBottom: i < inquiries.length - 1 ? '1px solid rgba(74,124,63,0.3)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,124,63,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: inq.status === '답변완료' ? 'rgba(76,255,114,0.2)' : 'rgba(245,200,66,0.2)',
                    border: `1px solid ${inq.status === '답변완료' ? '#4cff72' : '#f5c842'}`,
                    borderRadius: '6px', padding: '2px 8px',
                    color: inq.status === '답변완료' ? '#4cff72' : '#f5c842', fontSize: '0.8rem',
                  }}>{inq.status}</span>
                  <span style={{ color: '#fff' }}>{inq.title}</span>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(inq.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              {isAdmin && <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{inq.nickname}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 접속유저 탭 ──────────────────────────────────────────
function OnlineTab({ token }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await api('GET', '/users/online', null, token);
      if (!res) return;
      const data = await res.json();
      setUsers(data.users || []);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div style={cardStyle}>
      <h3 style={{ color: '#f5c842', margin: '0 0 16px' }}>🟢 접속중인 유저 ({users.length}명)</h3>
      {users.length === 0 ? (
        <div style={emptyStyle}>접속중인 유저가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {users.map(u => (
            <div key={u.username} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(74,124,63,0.15)', border: '1px solid #4a7c3f',
              borderRadius: '20px', padding: '8px 16px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4cff72', boxShadow: '0 0 6px #4cff72' }} />
              <span style={{ color: '#fff' }}>{u.nickname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 공통 댓글 컴포넌트 ───────────────────────────────────
function CommentSection({ comments, onAdd, onDelete, comment, setComment, profile }) {
  return (
    <div style={{ borderTop: '1px solid #4a7c3f', paddingTop: '16px', marginTop: '16px' }}>
      <h4 style={{ color: '#f5c842', margin: '0 0 16px' }}>💬 댓글 {comments.length}개</h4>
      {comments.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>첫 댓글을 남겨보세요!</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid rgba(74,124,63,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#f5c842', fontSize: '0.85rem' }}>{c.nickname}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                  {c.username === profile.username && (
                    <button onClick={() => onDelete(c.id)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ff4444', background: 'transparent', color: '#ff4444', cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Jua', sans-serif" }}>삭제</button>
                  )}
                </div>
              </div>
              <p style={{ color: '#ddd', fontSize: '0.9rem', margin: 0 }}>{c.content}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input placeholder="댓글을 입력해주세요..." value={comment} onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: "'Jua', sans-serif" }} />
        <button onClick={onAdd} style={submitBtn}>등록</button>
      </div>
    </div>
  );
}

// ── 공통 스타일 ──────────────────────────────────────────
const cardStyle = { background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f', borderRadius: '16px', padding: '24px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: "'Jua', sans-serif", boxSizing: 'border-box' };
const formStyle = { background: 'rgba(74,124,63,0.1)', border: '1px solid #4a7c3f', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' };
const submitBtn = { padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#4a7c3f', color: '#fff', cursor: 'pointer', fontSize: '1rem', fontFamily: "'Jua', sans-serif" };
const writeBtn = { padding: '8px 16px', borderRadius: '8px', border: '1px solid #4a7c3f', background: 'rgba(74,124,63,0.2)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'Jua', sans-serif" };
const dangerBtn = { padding: '8px 20px', borderRadius: '8px', border: '1px solid #ff4444', background: 'transparent', color: '#ff4444', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'Jua', sans-serif" };
const backBtn = { padding: '6px 16px', borderRadius: '8px', border: '1px solid #4a7c3f', background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'Jua', sans-serif", marginBottom: '16px' };
const listItem = { padding: '14px 16px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s' };
const loadingStyle = { color: '#888', textAlign: 'center', padding: '40px' };
const emptyStyle = { color: '#888', textAlign: 'center', padding: '40px' };

export default Main;