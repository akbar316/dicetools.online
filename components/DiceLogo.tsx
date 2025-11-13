import React from 'react';

const DiceLogo: React.FC = () => {
  return (
    <div className="dice-logo-container">
      <div className="dice-scene">
        <div className="dice">
          <div className="face face-1">
            <span className="pip pip-1"></span>
          </div>
          <div className="face face-2">
            <span className="pip pip-1"></span>
            <span className="pip pip-2"></span>
          </div>
          <div className="face face-3">
            <span className="pip pip-1"></span>
            <span className="pip pip-2"></span>
            <span className="pip pip-3"></span>
          </div>
          <div className="face face-4">
            <span className="pip pip-1"></span>
            <span className="pip pip-2"></span>
            <span className="pip pip-3"></span>
            <span className="pip pip-4"></span>
          </div>
          <div className="face face-5">
            <span className="pip pip-1"></span>
            <span className="pip pip-2"></span>
            <span className="pip pip-3"></span>
            <span className="pip pip-4"></span>
            <span className="pip pip-5"></span>
          </div>
          <div className="face face-6">
            <span className="pip pip-1"></span>
            <span className="pip pip-2"></span>
            <span className="pip pip-3"></span>
            <span className="pip pip-4"></span>
            <span className="pip pip-5"></span>
            <span className="pip pip-6"></span>
          </div>
        </div>
      </div>
      <span>DiceTools</span>
    </div>
  );
};

export default DiceLogo;
