import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, Extrapolation, interpolate, runOnJS, withTiming, useSharedValue } from 'react-native-reanimated';
import { SCREEN_HEIGHT, BOTTOM_HEIGHT } from '@/lib/utils/screen.size';
import { useAnimation } from '@/lib/context/animate.context';
import { useMusic } from '@/lib/context/music.context';

//제스처 관련 상수 정의
const SCREEN_DIVISION = 20;
const CLOSE_THRESHOLD = 0.2;
const OPEN_THRESHOLD = 0.3;
const FULLY_OPEN_THRESHOLD = 0.8;
const TIMING_DURATION = 500;

/**
 * 화면 높이에 따른 단계별 값을 가진 배열을 생성하는 함수
 */
const generateTranslationArrays = () => {
    const step = SCREEN_HEIGHT / SCREEN_DIVISION;
    const step2 = 1 / SCREEN_DIVISION;
    const diff = Array.from({ length: SCREEN_DIVISION + 1 }, (_, i) => step * i).reverse();
    const diff2 = Array.from({ length: SCREEN_DIVISION + 1 }, (_, i) => step2 * i);
    return [diff, diff2];
};

export const ExampleGestureScreen = () => {
    const { closeMusic, pendingMusic, defaultValue, openMusic, pendingBar } = useAnimation();
    const { loadingComplete, handlePlayMusic } = useMusic();
    const [refryArray, refryArray2] = generateTranslationArrays();
    const upperValue = useSharedValue(true);
    const refryValue = useSharedValue(true);

    /** 특정 값으로 애니메이션 실행 */
    const animateTo = (value: number) => {
        defaultValue.value = withTiming(value, { duration: TIMING_DURATION, easing: Easing.inOut(Easing.ease) });
    };

    /** 음악 종료 함수 */
    const closeStopMusic = () => {
        if (pendingBar && loadingComplete) {
            handlePlayMusic('end');
            closeMusic();
        } else {
            animateTo(CLOSE_THRESHOLD);
            upperValue.value = true;
        }
    };

    /** 팬 제스처 업데이트 시 동작 */
    const handleGestureUpdate = (translationY: number) => {
        if (upperValue.value) {
            if (translationY > 0) {
                defaultValue.value = interpolate(translationY, refryArray, refryArray2, {
                    extrapolateRight: Extrapolation.EXTEND,
                });
            }
        } else {
            if (translationY > 0) {
                defaultValue.value = interpolate(
                    translationY + SCREEN_HEIGHT - BOTTOM_HEIGHT * 1.5,
                    refryArray,
                    refryArray2,
                    { extrapolateRight: Extrapolation.EXTEND }
                );
            }
        }
        refryValue.value = defaultValue.value > CLOSE_THRESHOLD;
    };

    /** 팬 제스처 종료 시 동작 */
    const handleGestureEnd = () => {
        if (upperValue.value) {
            if (defaultValue.value > FULLY_OPEN_THRESHOLD) {
                animateTo(1);
                upperValue.value = true;
            } else {
                runOnJS(pendingMusic)(true);
                upperValue.value = false;
            }
        } else {
            //값에 따라 완전히 열림 상태, 재생바 상태, 음악 종료로 상태변경
            if (defaultValue.value > OPEN_THRESHOLD) {
                upperValue.value = true;
                runOnJS(openMusic)();
            } else if (defaultValue.value < CLOSE_THRESHOLD) {
                upperValue.value = true;
                runOnJS(closeStopMusic)();
            } else {
                upperValue.value = false;
                runOnJS(pendingMusic)();
            }
        }
    };

    /** 팬 제스처 */
    const panGesture = Gesture.Pan()
        .enabled(loadingComplete)
        .onUpdate((e) => handleGestureUpdate(e.translationY))
        .onEnd(handleGestureEnd);

    return (
        <GestureHandlerRootView>
            <GestureDetector gesture={panGesture}>
                {/* component*/}
            </GestureDetector>
        </GestureHandlerRootView>
    )

}
