// Modal.jsx - 범용 모달 컴포넌트
import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'medium', // 'small', 'medium', 'large', 'xlarge'
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className = ''
}) => {
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);

    // 중복 모달 방지
    useEffect(() => {
        if (isOpen) {
            // 기존에 같은 클래스의 모달이 이미 있는지 확인
            const existingModals = document.querySelectorAll('.modal-overlay');
            if (existingModals.length > 1) {
                console.warn('[Modal] 🚨 중복 모달 감지됨:', existingModals.length, '개 - 기존 모달들 정리');
                
                // 첫 번째를 제외한 나머지 모달들 제거
                for (let i = 1; i < existingModals.length; i++) {
                    existingModals[i].remove();
                }
            }
        }
    }, [isOpen]);

    // 모달 열릴 때 포커스 관리
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            // 모달이 열리면 첫 번째 포커스 가능한 요소로 포커스 이동
            const firstFocusableElement = modalRef.current?.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusableElement) {
                firstFocusableElement.focus();
            }
        } else {
            // 모달이 닫히면 이전 포커스 복원
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onClose, closeOnOverlayClick]);

    // ESC 키 감지
    useEffect(() => {
        const handleEscape = (event) => {
            if (closeOnEscape && event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen, onClose, closeOnEscape]);

    // 모달 열릴 때 body 스크롤 방지 및 정리
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        
        // 컴포넌트 unmount 시 반드시 정리
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // 모달 클릭 핸들러 (이벤트 전파 방지)
    const handleModalClick = useCallback((e) => {
        e.stopPropagation();
    }, []);

    // Tab 키 트랩 (접근성)
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }, []);

    // 모달이 닫혀있으면 아무것도 렌더링하지 않음
    if (!isOpen) {
        return null;
    }

    const modalContent = (
        <div 
            className="modal-overlay" 
            role="dialog" 
            aria-modal="true"
            style={{ pointerEvents: 'auto' }}
            onClick={closeOnOverlayClick ? onClose : undefined}
        >
            <div 
                className={`modal-container modal-${size} ${className}`}
                ref={modalRef}
                onClick={handleModalClick}
                onKeyDown={handleKeyDown}
            >
                {/* 모달 헤더 */}
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && <h2 className="modal-title">{title}</h2>}
                        {showCloseButton && (
                            <button 
                                className="modal-close-button"
                                onClick={onClose}
                                aria-label="모달 닫기"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path 
                                        d="M18 6L6 18M6 6L18 18" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* 모달 컨텐츠 */}
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    );

    // 포탈을 사용하여 body에 모달 렌더링
    return createPortal(modalContent, document.body);
};

export default Modal;