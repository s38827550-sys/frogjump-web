import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bg from '../assets/background_mygame2.png';
import frogNormal from '../assets/frog_normal.PNG';
import frogJump from '../assets/frog_jump.PNG';
import frogLeft from '../assets/frog_left.PNG';
import frogRight from '../assets/frog_right.PNG';

const API_BASE = process.env.REACT_APP_API_URL || 'https://frogjump-leaderboard-remake.onrender.com';

function AnimatedFrog({ initX, initY }) {
  const [pos, setPos] = useState({ x: initX, y: initY });
  const [isJumping, setIsJumping] = useState(false);
  const [direction, setDirection] = useState(1);
  const [caught, setCaught] = useState(false);
  const [dust, setDust] = useState(false);
  const posRef = useRef({ x: initX, y: initY });
  const velRef = useRef({ x: 0, y: 0 });
  const jumpingRef = useRef(false);
  const dirRef = useRef(1);
  const caughtRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseVel = useRef({ x: 0, y: 0 });
  const groundY = initY;

  useEffect(() => {
    const gravity = 0.5;
    const jumpInterval = setInterval(() => {
      if (!jumpingRef.current && !caughtRef.current) {
        const newDir = Math.random() > 0.5 ? 1 : -1;
        dirRef.current = newDir;
        setDirection(newDir);
        velRef.current = { x: newDir * (0.5 + Math.random() * 2), y: -(1.5 + Math.random() * 4) };
        jumpingRef.current = true;
        setIsJumping(true);
      }
    }, 1200 + Math.random() * 800);

    const physics = setInterval(() => {
      if (!jumpingRef.current || caughtRef.current) return;
      velRef.current.y += gravity;
      posRef.current = { x: posRef.current.x + velRef.current.x, y: posRef.current.y + velRef.current.y };
      if (posRef.current.y >= groundY) {
        posRef.current.y = groundY;
        velRef.current = { x: 0, y: 0 };
        jumpingRef.current = false;
        setIsJumping(false);
      }
      if (posRef.current.x < 2) { posRef.current.x = 2; velRef.current.x = Math.abs(velRef.current.x); dirRef.current = 1; setDirection(1); }
      if (posRef.current.x > 93) { posRef.current.x = 93; velRef.current.x = -Math.abs(velRef.current.x); dirRef.current = -1; setDirection(-1); }
      setPos({ ...posRef.current });
    }, 16);

    return () => { clearInterval(jumpInterval); clearInterval(physics); };
  }, [groundY]);

  const handleMouseDown = (e) => { e.preventDefault(); caughtRef.current = true; setCaught(true); jumpingRef.current = false; velRef.current = { x: 0, y: 0 }; setIsJumping(false); };
  const handleMouseUp = () => { caughtRef.current = false; setCaught(false); velRef.current = { x: mouseVel.current.x * 0.4, y: mouseVel.current.y * 0.4 }; jumpingRef.current = true; setIsJumping(true); };

  useEffect(() => {
    if (!caught) return;
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      mouseVel.current = { x: x - lastMousePos.current.x, y: y - lastMousePos.current.y };
      lastMousePos.current = { x, y };
      posRef.current = { x, y };
      setPos({ x, y });
    };
    const handleGlobalMouseUp = () => { if (caughtRef.current) handleMouseUp(); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleGlobalMouseUp); };
  }, [caught]);

  const prevJumpingRef = useRef(false);
  useEffect(() => {
    if (prevJumpingRef.current && !isJumping) { setDust(true); setTimeout(() => setDust(false), 500); }
    prevJumpingRef.current = isJumping;
  }, [isJumping]);

  const img = caught ? frogNormal : isJumping ? frogJump : direction > 0 ? frogRight : frogLeft;

  return (
    <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, zIndex: caught ? 20 : 5 }}>
      {dust && (
        <div style={{ position: 'absolute', top: '28px', left: '-10px', display: 'flex', gap: '4px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(180,150,80,0.7)', animation: 'dustAnim 0.5s ease-out forwards', animationDelay: `${i * 0.05}s`, transform: `translateX(${(i - 2) * 8}px)` }} />
          ))}
        </div>
      )}
      <img src={img} alt="frog" draggable={false} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onDragStart={(e) => e.preventDefault()}
        style={{ width: '38px', imageRendering: 'pixelated', filter: caught ? 'drop-shadow(0 0 8px #7ae8ff)' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))', cursor: caught ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserDrag: 'none', display: 'block' }}
      />
    </div>
  );
}

const FROGS = [
  { id: 1, initX: 8, initY: 64 },
  { id: 2, initX: 75, initY: 70 },
  { id: 3, initX: 20, initY: 78 },
  { id: 4, initX: 85, initY: 62 },
  { id: 5, initX: 45, initY: 74 },
];

function Register() {
  const [form, setForm] = useState({ username: '', nickname: '', password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.username.length < 2) { setError('아이디는 2자 이상이어야 합니다.'); return; }
    if (form.nickname.length < 2) { setError('닉네임은 2자 이상이어야 합니다.'); return; }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          nickname: form.nickname,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError(data.detail === 'Nickname already exists' ? '이미 사용중인 닉네임입니다.' : '이미 사용중인 아이디입니다.');
        return;
      }
      if (!res.ok) {
        setError('회원가입에 실패했습니다.');
        return;
      }

      alert('회원가입 완료! 🐸');
      navigate('/login');
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      backgroundAttachment: 'fixed',
    }}>
      {FROGS.map(f => <AnimatedFrog key={f.id} initX={f.initX} initY={f.initY} />)}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', zIndex: 10 }}>
        <img src={frogNormal} alt="frog" style={{ width: '60px', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.8))' }} />
        <div style={{ fontFamily: "'Jua', sans-serif", fontSize: '2.5rem', color: '#f5c842', textShadow: '0 0 20px #f5c842, 4px 4px 0 #1a4a00', letterSpacing: '4px' }}>
          Sign Up
        </div>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.78)', border: '2px solid #4a7c3f',
        borderRadius: '16px', padding: '40px', width: '360px',
        boxShadow: '0 0 30px rgba(0,0,0,0.8)', zIndex: 10,
      }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input name="username" placeholder="아이디 (2자 이상)" value={form.username} onChange={handleChange} required style={inputStyle} />
          <input name="nickname" placeholder="닉네임 (2자 이상)" value={form.nickname} onChange={handleChange} required style={inputStyle} />
          <input name="password" type="password" placeholder="비밀번호 (6자 이상)" value={form.password} onChange={handleChange} required style={inputStyle} />
          <input name="passwordConfirm" type="password" placeholder="비밀번호 확인" value={form.passwordConfirm} onChange={handleChange} required style={inputStyle} />

          {error && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={buttonStyle}
            onMouseEnter={e => e.target.style.background = '#5a9c4f'}
            onMouseLeave={e => e.target.style.background = '#4a7c3f'}
          >
            {loading ? '처리중...' : '회원가입'}
          </button>
        </form>

        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: '#7ae8ff' }}>로그인</Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px', borderRadius: '8px',
  border: '1px solid #4a7c3f', background: 'rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '1rem', outline: 'none',
};

const buttonStyle = {
  padding: '12px', borderRadius: '8px', border: 'none',
  background: '#4a7c3f', color: '#fff', fontSize: '1rem',
  cursor: 'pointer', fontWeight: 'bold', marginTop: '8px',
  transition: 'background 0.2s', fontFamily: "'Jua', sans-serif",
};

export default Register;