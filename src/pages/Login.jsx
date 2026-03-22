import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import bg from '../assets/background_mygame2.png';
import frogNormal from '../assets/frog_normal.PNG';
import frogJump from '../assets/frog_jump.PNG';
import frogLeft from '../assets/frog_left.PNG';
import frogRight from '../assets/frog_right.PNG';

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
  const groundY = initY;

  useEffect(() => {
    const gravity = 0.5;
    const jumpInterval = setInterval(() => {
      if (!jumpingRef.current && !caughtRef.current) {
        const newDir = Math.random() > 0.5 ? 1 : -1;
        dirRef.current = newDir;
        setDirection(newDir);
        velRef.current = {
          x: newDir * (0.5 + Math.random() * 2),
          y: -(1.5 + Math.random() * 4),
        };
        jumpingRef.current = true;
        setIsJumping(true);
      }
    }, 1200 + Math.random() * 800);

    const physics = setInterval(() => {
      if (!jumpingRef.current || caughtRef.current) return;

      velRef.current.y += gravity;
      posRef.current = {
        x: posRef.current.x + velRef.current.x,
        y: posRef.current.y + velRef.current.y,
      };

      if (posRef.current.y >= groundY) {
        posRef.current.y = groundY;
        velRef.current = { x: 0, y: 0 };
        jumpingRef.current = false;
        setIsJumping(false);
      }

      if (posRef.current.x < 2) {
        posRef.current.x = 2;
        velRef.current.x = Math.abs(velRef.current.x);
        dirRef.current = 1;
        setDirection(1);
      }
      if (posRef.current.x > 93) {
        posRef.current.x = 93;
        velRef.current.x = -Math.abs(velRef.current.x);
        dirRef.current = -1;
        setDirection(-1);
      }

      setPos({ ...posRef.current });
    }, 16);

    return () => {
      clearInterval(jumpInterval);
      clearInterval(physics);
    };
  }, [groundY]);

  const lastMousePos = useRef({ x: 0, y: 0 });
const mouseVel = useRef({ x: 0, y: 0 });

const handleMouseDown = (e) => {
  e.preventDefault();
  caughtRef.current = true;
  setCaught(true);
  jumpingRef.current = false;
  velRef.current = { x: 0, y: 0 };
  setIsJumping(false);
};

const handleMouseUp = () => {
  caughtRef.current = false;
  setCaught(false);
  velRef.current = {
    x: mouseVel.current.x * 0.4,
    y: mouseVel.current.y * 0.4,
  };
  jumpingRef.current = true;
  setIsJumping(true);
};

useEffect(() => {
  if (!caught) return;
  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    mouseVel.current = {
      x: x - lastMousePos.current.x,
      y: y - lastMousePos.current.y,
    };
    lastMousePos.current = { x, y };

    posRef.current = { x, y };
    setPos({ x, y });
  };
  const handleGlobalMouseUp = () => {
    if (caughtRef.current) handleMouseUp();
  };
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };
}, [caught]);

  // 바닥 착지 감지 → 먼지 애니메이션
  const prevJumpingRef = useRef(false);
  useEffect(() => {
    if (prevJumpingRef.current && !isJumping) {
      setDust(true);
      setTimeout(() => setDust(false), 500);
    }
    prevJumpingRef.current = isJumping;
  }, [isJumping]);

  const img = caught
    ? frogNormal
    : isJumping
    ? frogJump
    : direction > 0 ? frogRight : frogLeft;

  return (
    <div style={{
      position: 'absolute',
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      zIndex: caught ? 20 : 5,
    }}>
      {/* 먼지 애니메이션 */}
      {dust && (
        <div style={{ position: 'absolute', top: '28px', left: '-10px', display: 'flex', gap: '4px' }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
                borderRadius: '50%',
                background: 'rgba(180, 150, 80, 0.7)',
                animation: `dustAnim 0.5s ease-out forwards`,
                animationDelay: `${i * 0.05}s`,
                transform: `translateX(${(i - 2) * 8}px)`,
              }}
            />
          ))}
        </div>
      )}

      <img
        src={img}
        alt="frog"
        draggable={false}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
        style={{
          width: '38px',
          imageRendering: 'pixelated',
          filter: caught
            ? 'drop-shadow(0 0 8px #7ae8ff)'
            : 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
          cursor: caught ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}

const FROGS = [
  { id: 1, initX: 8,  initY: 64 },
  { id: 2, initX: 75, initY: 70 },
  { id: 3, initX: 20, initY: 78 },
  { id: 4, initX: 85, initY: 62 },
  { id: 5, initX: 45, initY: 74 },
];

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) navigate('/main');
    }
    checkUser();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('username', username)
      .single();

    if (fetchError || !userData) {
      setError('아이디가 존재하지 않습니다.');
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    });

    if (loginError) {
      setError('비밀번호가 올바르지 않습니다.');
      return;
    }

    // 탈퇴한 유저인지 확인
    const { data: userStatus } = await supabase
      .from('users')
      .select('status, deleted_at')
      .eq('username', username)
      .single();

    if (userStatus?.status === 'deleted') {
      const deletedAt = new Date(userStatus.deleted_at);
      const now = new Date();
      const hoursDiff = (now - deletedAt) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const hoursLeft = Math.ceil(24 - hoursDiff);
        setError(`탈퇴한 계정이에요. ${hoursLeft}시간 후에 재가입 가능합니다.`);
        await supabase.auth.signOut();
        return;
      }
    }

    navigate('/main');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* 개구리 애니메이션 */}
      {FROGS.map(f => (
        <AnimatedFrog key={f.id} initX={f.initX} initY={f.initY} />
      ))}

      {/* 게임 타이틀 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '36px',
        zIndex: 10,
      }}>
        <img
          src={frogNormal}
          alt="frog"
          style={{ width: '60px', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.8))' }}
        />
        <div style={{
          fontFamily: "'Jua', sans-serif",
          fontSize: '3.5rem',
          color: '#f5c842',
          textShadow: '0 0 20px #f5c842, 4px 4px 0 #1a4a00, -2px -2px 0 #1a4a00',
          letterSpacing: '4px',
        }}>
          Frog Jump
        </div>
      </div>

      {/* 로그인 박스 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.78)',
        border: '2px solid #4a7c3f',
        borderRadius: '16px',
        padding: '40px',
        width: '360px',
        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
        zIndex: 10,
      }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={e => e.target.style.background = '#5a9c4f'}
            onMouseLeave={e => e.target.style.background = '#4a7c3f'}
          >
            로그인
          </button>
        </form>
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          아이디가 없으신가요?{' '}
          <Link to="/register" style={{ color: '#7ae8ff' }}>회원가입</Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #4a7c3f',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
};

const buttonStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  background: '#4a7c3f',
  color: '#fff',
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '8px',
  transition: 'background 0.2s',
  fontFamily: "'Jua', sans-serif",
};

export default Login;