import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MapScene from './MapScene';
import MainScene from './MainScene';

export default function Game() {
  const gameRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!gameRef.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO, 
      width: 800, 
      height: 600,
      parent: gameRef.current, 
      backgroundColor: '#000000',
      scene: [MapScene, MainScene]
    });
    
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      {/* Phaser 遊戲畫布會放在這裡 */}
      <div 
        ref={gameRef} 
        style={{ 
          border: '2px solid #333', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
          position: 'relative' // 為了未來蓋上 React 結算 UI 做準備
        }} 
      />
    </div>
  );
}