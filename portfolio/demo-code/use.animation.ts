/**
 * 여러개의 animation glb파일을 한번에 로드 시켜주는 hook
 */

import { AnimationAction, AnimationMixer, Group, AnimationClip } from 'three';
import { useAnimations as dreiUseAnimations, useGLTF } from '@react-three/drei';
import { AvatarAnimationHello, AvatarAnimationIdle, AvatarAnimationTalk } from '@/const/avatar.const';


type AnimationMappings = Record<string, AnimationAction>;
type GenderType = 'male' | 'female'

export interface UseAnimationsReturnType {
    actions: AnimationMappings;
    mixer: AnimationMixer;
    names: string[];
}

export const useAnimations = (animations: AnimationClip[], group: Group): UseAnimationsReturnType => {
    return dreiUseAnimations(animations, group) as UseAnimationsReturnType;
};

export const useGLTFAnimations = (type: GenderType) => {
    const idleMotions = ['idle_1', 'idle_2', 'idle_3', 'idle_4'];
    const talkMotions = ['talk_1', 'talk_2', 'talk_3' , 'talk_4', 'talk_6'];
    const helloMotions = ['hello_1', 'hello_2', 'hello_3'];
    const idleAnimations = idleMotions.map((motion) => useGLTF(AvatarAnimationIdle(type, motion)));
    const talkAnimations = talkMotions.map((motion) => useGLTF(AvatarAnimationTalk(type, motion)));
    const helloAnimation = helloMotions.map((motion) => useGLTF(AvatarAnimationHello(type, motion)));

    return [...idleAnimations, ...talkAnimations, helloAnimation];
};

/**
 *
 * @param {GenderType} type - male | female
 * @param {Group} group - <THREE.Group>
 */
export const useMergedAnimationsLoader = (type: GenderType, group: Group) => {
    const gltfResults = useGLTFAnimations(type);
    const animations = gltfResults.flatMap(({ animations }) => animations);
    const scenes = gltfResults.map(({ scene }) => scene);
    const animationData = useAnimations(animations, group);
    return {
        animations,
        scenes,
        ...animationData
    };
};