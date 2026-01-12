import { useRef } from "react";
import { pages, pageAtom } from "./UI";
import * as THREE from "three";
import { useMemo } from "react";
import { Vector3 } from "three";
import { Color } from "three";
// import { useHelper } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { MeshStandardMaterial } from "three";
import { useAtom } from "jotai";
import { MathUtils } from "three";
import { easing } from "maath";
import { degToRad } from "three/src/math/MathUtils.js";


const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

const pageWidth = 1.28;
const pageHeight = 1.71;
const pageDepth = 0.003;
const pageSegments = 30;
const segmentWidth = pageWidth / pageSegments;

const PageGeometry = new THREE.BoxGeometry(
    pageWidth, 
    pageHeight, 
    pageDepth, 
    pageSegments,
    2
);

PageGeometry.translate(pageWidth / 2, 0, 0);

const position = PageGeometry.attributes.position;
const vertex = new Vector3;
const skinIndexes =[];
const skinWeights =[];

for (let i = 0; i < position.count; i++) {
    //all vertices
    vertex.fromBufferAttribute(position, i); //get the vertex
    const x = vertex.x; //get the x coordinate of the vertex

    const skinIndex = Math.max(0, Math.floor(x / segmentWidth));
    let skinWeight = (x % segmentWidth) / segmentWidth;

    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

PageGeometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(skinIndexes, 4)
);
PageGeometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");

const pageMaterials = [
    new THREE.MeshStandardMaterial({
        color: whiteColor,
        skinning: true,
    }),
    new THREE.MeshStandardMaterial({
        color: "#111",
        skinning: true,
    }),
    new THREE.MeshStandardMaterial({
        color: whiteColor,
        skinning: true,
    }),
    new THREE.MeshStandardMaterial({
        color: whiteColor,
        skinning: true,
    }),
];

const Page = ({ number, front, back, page, opened, bookClosed, ...props }) => {
    const isCover = number === 0;
    const isBackCover = number === pages.length - 1;
    
    const textureUrls = [
        `/textures/${front}.jpg`,
        `/textures/${back}.jpg`,
        ...(isCover || isBackCover ? [`/textures/book-cover-roughness-2.jpg`] : [])
    ];
    
    const textures = useTexture(textureUrls);
    const picture = textures[0];
    const picture2 = textures[1];
    const pictureRoughness = textures[2];
    
    const group = useRef();
    const skinnedMeshRef = useRef();
    const turnedAt = useRef(0);
    const lastOpened = useRef(opened);

    const manualSkinnedMesh = useMemo(() => {
        const bones = [];
        for (let i = 0; i <= pageSegments; i++) {
            let bone = new THREE.Bone();
            bones.push(bone);
            if (i === 0) {
                bone.position.x = 0;
            } else {
                bone.position.x = segmentWidth;
            }
            if (i > 0) {
                bones[i - 1].add(bone); //attach the new bone to the previous bone
            }
        }
        const skeleton = new THREE.Skeleton(bones);

        const materials = [...pageMaterials,
          new MeshStandardMaterial({
            color: whiteColor,
            map: picture,
            skinning: true,
            ...(isCover && pictureRoughness
                ? {
                    roughnessMap: pictureRoughness,
                }
                : {
                    roughness: 0.1,
                }
            )
          }),
          new MeshStandardMaterial({
            color: whiteColor,
            map: picture2,
            skinning: true,
            ...(isBackCover && pictureRoughness
                ? {
                    roughnessMap: pictureRoughness,
                }
                : {
                    roughness: 0.1,
                }
            )
          }),
        ];
        const mesh = new THREE.SkinnedMesh(PageGeometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        mesh.add(skeleton.bones[0]);
        mesh.bind(skeleton);
        return mesh;
    }, [picture, picture2, pictureRoughness, isCover, isBackCover]);

    // useHelper(skinnedMeshRef, THREE.SkeletonHelper, "red");

    useFrame((_, delta) => {
        if (!skinnedMeshRef.current) { 
            return;
        }

        if (lastOpened.current !== opened) {
            turnedAt.current = +new Date();
            lastOpened.current = opened;
        }
        let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
        turningTime = Math.sin(turningTime * Math.PI);

        let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;

        if (!bookClosed) {
            targetRotation += degToRad(number * 0.8);
        }

        const bones = skinnedMeshRef.current.skeleton.bones;
        
        for (let i = 0; i < bones.length; i++) {
            const target = i === 0 ? group.current : bones[i];

            const insideCurveIntensity = i < 7 ? Math.sin(i * 0.2 + 0.25) : 0;
            const outsideCurveIntensity = i >= 7 ? Math.cos(i * 0.3 + 0.09) : 0;
            const turningIntensity = Math.sin(i * Math.PI * (2 / bones.length)) * turningTime;
            
            let rotationAngle =
                insideCurveStrength * insideCurveIntensity * targetRotation -
                outsideCurveStrength * outsideCurveIntensity * targetRotation +
                turningCurveStrength * turningIntensity * targetRotation;
            
            let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
            
            if (bookClosed) {
                if (i === 0) {
                    rotationAngle = targetRotation;
                    foldRotationAngle = 0;
                } else {
                    rotationAngle = 0;
                    foldRotationAngle = 0;
                }
            }
            
            easing.dampAngle(
                target.rotation,
                "y",
                rotationAngle,
                easingFactor,
                delta
            );

            const foldIntensity = i > 8
                ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
                : 0;
            easing.dampAngle(
                target.rotation,
                "x",
                foldRotationAngle * foldIntensity,
                easingFactorFold,
                delta
            );
        }
    });




    return (
        <group {...props} ref={group}>
             <primitive 
                object={manualSkinnedMesh} 
                ref={skinnedMeshRef}
                position-z={-number * pageDepth + page * pageDepth}
             />
        </group>
    )
}

export const Book = ({ ...props}) => {
    const [page] = useAtom(pageAtom);
    return ( <group {...props}>
        {
            [...pages].map((pageData, index) => (
                
                <Page 
                key={index} 
                page={page}
                number={index} 
                opened= {page > index}
                bookClosed = {page === 0 || page === pages.length - 1}
                {...pageData} />   
                
      ))}
    </group>
  );
};