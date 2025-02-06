/**
 * 각 아바타들의 자연스러운 눈 깜박임을 구현하기 위한 커스텀 훅
 */

import { useEffect, useRef } from 'react';
import { Scene, Object3D, SkinnedMesh, MathUtils } from 'three';
import { BLINK_SPEED_MS } from '@/const/avatar.const';

const updateMorphTarget = (child: Object3D, target: string, value: number): void => {
    const skinnedMesh = child as SkinnedMesh;
    if (skinnedMesh.isSkinnedMesh && skinnedMesh.morphTargetDictionary) {
        const index = skinnedMesh.morphTargetDictionary[target];
        if (index !== undefined && skinnedMesh.morphTargetInfluences) {
            skinnedMesh.morphTargetInfluences[index] = value;
        }
    }
};

/**
 * @param {Scene} scene
 * @param {string} target
 * @param {number} startValue - 애니메이션 시작 값
 * @param {number} endValue - 애니메이션 종료 값
 * @param {number} duration - 애니메이션 지속 시간 (ms)
 * @returns {Promise<void>}
 */
const animateMorphTarget = (
    scene: Scene,
    target: string,
    startValue: number,
    endValue: number,
    duration: number
): Promise<void> => {
    return new Promise((resolve) => {
        const update = (startTime: number) => (time: DOMHighResTimeStamp) => {
            const progress = (time - startTime) / duration; //진행률
            if (progress >= 1) {
                scene.traverse((child) => updateMorphTarget(child, target, endValue));
                return resolve();
            }
            const value = MathUtils.lerp(startValue, endValue, progress); //lerp 값
            scene.traverse((child) => updateMorphTarget(child, target, value));
            requestAnimationFrame(update(startTime));
        };
        requestAnimationFrame(update(performance.now()));
    });
};

const handleBlinkAnimation = async (scene: Scene): Promise<void> => {
    await Promise.all([
        animateMorphTarget(scene, 'eyeBlinkLeft', 0, 1, BLINK_SPEED_MS),
        animateMorphTarget(scene, 'eyeBlinkRight', 0, 1, BLINK_SPEED_MS)
    ]);
    await Promise.all([
        animateMorphTarget(scene, 'eyeBlinkLeft', 1, 0, BLINK_SPEED_MS),
        animateMorphTarget(scene, 'eyeBlinkRight', 1, 0, BLINK_SPEED_MS)
    ]);
};

/**
 * 눈깜빡임 애니메이션을 실행하는 커스텀 훅.
 * @param {Scene} scene
 * @param {number} [minInterval=5000] - 최소 간격 (ms)
 * @param {number} [maxInterval=10000] - 최대 간격 (ms)
 */
export const useBlinkingAnimation = (
    scene: Scene,
    minInterval: number = 5000,
    maxInterval: number = 10000
) => {
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        /**
         * 실행하고 다음 호출을 예약하는 함수
         */
        const startBlinking = () => {
            handleBlinkAnimation(scene);
            const interval = Math.random() * (maxInterval - minInterval) + minInterval; // 무작위 간격 설정
            timerRef.current = window.setTimeout(startBlinking, interval);
        };

        startBlinking();

        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
        };
    }, [scene, minInterval, maxInterval]);
};