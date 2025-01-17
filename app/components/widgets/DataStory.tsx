import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'lib/store';
import { setSelectedCounty } from '@/lib/features/map/mapSlice';

function LoremIpsum() {
    return (
        <article className='prose prose-sm max-w-none p-8'>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac rhoncus quam.</p>
            <p>
                Fringilla quam urna. Cras turpis elit, euismod eget ligula quis, imperdiet sagittis justo. In viverra
                fermentum ex ac vestibulum. Aliquam eleifend nunc a luctus porta. Mauris laoreet augue ut felis blandit,
                at iaculis odio ultrices. Nulla facilisi. Vestibulum cursus ipsum tellus, eu tincidunt neque tincidunt
                a.
            </p>
            <h2>Sub-header</h2>
            <p>
                In eget sodales arcu, consectetur efficitur metus. Duis efficitur tincidunt odio, sit amet laoreet massa
                fringilla eu.
            </p>
            <p>
                Pellentesque id lacus pulvinar elit pulvinar pretium ac non urna. Mauris id mauris vel arcu commodo
                venenatis. Aliquam eu risus arcu. Proin sit amet lacus mollis, semper massa ut, rutrum mi.
            </p>
            <p>Sed sem nisi, luctus consequat ligula in, congue sodales nisl.</p>
            <p>
                Vestibulum bibendum at erat sit amet pulvinar. Pellentesque pharetra leo vitae tristique rutrum. Donec
                ut volutpat ante, ut suscipit leo.
            </p>
            <h2>Sub-header</h2>
            <p>
                Maecenas quis elementum nulla, in lacinia nisl. Ut rutrum fringilla aliquet. Pellentesque auctor
                vehicula malesuada. Aliquam id feugiat sem, sit amet tempor nulla. Quisque fermentum felis faucibus,
                vehicula metus ac, interdum nibh. Curabitur vitae convallis ligula. Integer ac enim vel felis pharetra
                laoreet. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque hendrerit ac augue
                quis pretium.
            </p>
            <p>
                Morbi ut scelerisque nibh. Integer auctor, massa non dictum tristique, elit metus efficitur elit, ac
                pretium sapien nisl nec ante. In et ex ultricies, mollis mi in, euismod dolor.
            </p>
            <p>Quisque convallis ligula non magna efficitur tincidunt.</p>
            <p>
                Pellentesque id lacus pulvinar elit pulvinar pretium ac non urna. Mauris id mauris vel arcu commodo
                venenatis. Aliquam eu risus arcu. Proin sit amet lacus mollis, semper massa ut, rutrum mi.
            </p>
            <p>Sed sem nisi, luctus consequat ligula in, congue sodales nisl.</p>
            <p>
                Vestibulum bibendum at erat sit amet pulvinar. Pellentesque pharetra leo vitae tristique rutrum. Donec
                ut volutpat ante, ut suscipit leo.
            </p>
            <h2>Sub-header</h2>
            <p>
                Maecenas quis elementum nulla, in lacinia nisl. Ut rutrum fringilla aliquet. Pellentesque auctor
                vehicula malesuada. Aliquam id feugiat sem, sit amet tempor nulla. Quisque fermentum felis faucibus,
                vehicula metus ac, interdum nibh. Curabitur vitae convallis ligula. Integer ac enim vel felis pharetra
                laoreet. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque hendrerit ac augue
                quis pretium.
            </p>
            <p>
                Morbi ut scelerisque nibh. Integer auctor, massa non dictum tristique, elit metus efficitur elit, ac
                pretium sapien nisl nec ante. In et ex ultricies, mollis mi in, euismod dolor.
            </p>
            <p>Quisque convallis ligula non magna efficitur tincidunt.</p>
        </article>
    );
}

export default function DataStory() {
    const dispatch = useDispatch();

    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        container: containerRef,
        offset: ['start start', 'end end'],
    });

    const selectedCounty = useSelector((state: RootState) => state.map.selectedCounty);
    const counties = useSelector((state: RootState) => state.filters.rankedCounties);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

    useMotionValueEvent(scrollYProgress, 'change', (latest) => {
        if (latest > 0.3 && latest < 0.7 && counties?.length) {
            const randomIndex = Math.floor(Math.random() * counties.length);
            console.log('Current County:', selectedCounty?.name);
            console.log('Random County:', counties[randomIndex]?.name);
            dispatch(setSelectedCounty(counties[randomIndex]?.name));
        }
    });

    return (
        <div className='h-full'>
            {/* Progress bar fixed at top */}
            <motion.div className='h-2 origin-left bg-blue-500 z-50' style={{ scaleX: scrollYProgress }} />

            {/* Scrollable content */}
            <motion.div ref={containerRef} className='h-full overflow-auto'>
                <motion.div
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className=' flex flex-col justify-center px-8 py-12 bg-white'
                >
                    <h1 className='text-4xl font-bold tracking-tight text-gray-900 mb-4'>Exploring County Data</h1>
                    <p className='text-xl text-gray-600 max-w-2xl'>
                        Discover insights and patterns across counties through interactive visualizations and detailed
                        analysis
                    </p>
                </motion.div>
                <LoremIpsum />
            </motion.div>
        </div>
    );
}
