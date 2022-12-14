import { Image, StyleSheet, Text, View, TouchableOpacity, FlatList, ListRenderItemInfo, Modal, Alert, Dimensions } from 'react-native'
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Style } from '../../constants/Styles'
import { vmin, vmax, vw, vh, percentage } from 'rxn-units';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import PageHeader from '../CustomHeader';
import { Slider } from '@miblanchard/react-native-slider'
import DATA from '../../constants/Arrival.json'
import { API } from '../../constants/Api';
import FastImage from 'react-native-fast-image';
import { getMovieLength, getMoviePoster, GetQuibsById } from '../../services/QuibAPIs';
import { SvgUri } from 'react-native-svg';
import { LocalSvg } from 'react-native-svg';
import SyncButton from './SyncButton';
import Carousel from 'react-native-reanimated-carousel';
import QuibCarousel from './QuibCarousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import QuibCompose from './QuibCompose';


interface props {
    navigation: any;
    route: any,
}


const getFormattedTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const mintues = Math.floor((time - (hours * 3600)) / 60);
    const seconds = time - (hours * 3600) - (mintues * 60);
    return { hours, mintues, seconds }
}
const width = Dimensions.get('window').width;


export default function QuibPlayer({ navigation, route }: props) {
    const MovieLen = useRef(0);
    const isActive = useRef(false);
    const timer = useRef(0);
    const [MovieTime, setMovieTime] = useState(0);
    const [QuibTime, setQuibTime] = useState(0);
    const [PlayPause, setPlayPause] = useState('play');
    const { hours, mintues, seconds } = getFormattedTime(MovieTime);
    const [movieQuib, setMovieQuib] = useState<any[]>([]);
    const [IsLoading, setIsLoading] = useState(true)
    const flatRef = useRef<FlatList>(null);
    // const [Poster, setPoster] = useState(String);
    const posterRef = useRef(String);
    const [isPoster, setIsPoster] = useState(Boolean);
    const MovieId = route.params;
    const Movietitle = route.params.Movietitle;
    // const Movietitle = route.params;
    const quibTimeRef = useRef<number[]>([]);
    const quibScrubIndexRef = useRef<number>(0);
    const quibPlayIndexRef = useRef<number>(0);
    const resMap = useRef<any[]>([]);
    const [isVisble, setIsVisble] = useState(false);
    const [isVisbleModal, setIsVisbleModal] = useState(false);
    const [InSync, setInSync] = useState<boolean>(true);
    const [AllSync, setAllSync] = useState<boolean>(true);
    //Api calls 

    useEffect(() => {
        Promise.all([
            getMoviePoster(MovieId)
                .then((res: any) => posterRef.current = (res.map((res: any) => res.posterContent)))
                .then(() => FileCheck()),
            GetQuibsById(MovieId)
                .then((res: any) => { setMovieQuib(res); quibTimeRef.current = res.map((res: any) => res.time); resMap.current = res.filter((item: any) => item.isScreenshot == true || item.isSeedQuib); }),
            // .then(() => setC(() => movieQuib.map((res, inde) => {quibScrubIndexRef.current[inde] = inde; return res.time }))),
            // .then(() => console.log(quibTimeRef.current)),
            getMovieLength(MovieId)
                .then((res: any) => MovieLen.current = (res.map((res: any) => res.length)))
        ]).then(() => setIsLoading(false));
    }, [])



    // movie timer  stopwatch
    useEffect(() => {

        if (isActive.current && MovieTime < MovieLen.current) {
            // console.log(quibTimeRef.current[MovieTime]);
            if (quibTimeRef.current[quibPlayIndexRef.current] <= MovieTime) {
                flatRef.current?.scrollToIndex({
                    animated: true,
                    index: quibPlayIndexRef.current
                })
                console.log(quibTimeRef.current[quibPlayIndexRef.current]);
                quibPlayIndexRef.current = quibPlayIndexRef.current + 1;
            }

            timer.current = setInterval(() => {
                setQuibTime(MovieTime + 1)
                setMovieTime(MovieTime => MovieTime + 1);
            }, 1000);
        }
        else {
            clearInterval(timer.current);
            setPlayPause('play');
            isActive.current = false;
        }

        return () => clearInterval(timer.current);
    }, [isActive.current, MovieTime]);



    //file check
    const FileCheck = () => {
        let FS = posterRef.current.toString().split('.').pop();

        if (FS == 'jpeg' || FS == 'jpg') {
            setIsPoster(true);
            return
        }
        else setIsPoster(false);

    }

    //play button control
    const toggle = () => {
        if (isActive.current == false) {
            isActive.current = true;
            return setPlayPause('pause');
        }
        else {
            isActive.current = false;
            return setPlayPause('play');
        }

    }
    //Inc and dec on timer
    const IncSecond = () => {
        if (MovieTime < MovieLen.current)
            return setMovieTime((MovieTime) => MovieTime + 1)
    }
    const DecSecond = () => {
        if (MovieTime > 0)
            return setMovieTime((MovieTime) => MovieTime - 1)
    }


    // to sync the movie and quib scruber
    const SyncTime = () => {
        return setQuibTime(MovieTime)
    }

    //Quib list quibs head in (profile image, name, timestamp and quib)
    const QuibHead = ({ hours, mintues, seconds, image, name }: any) => {
        return (
            <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 1, flexDirection: 'row', }}>
                    <View style={{ justifyContent: 'flex-start', }}>
                        <TouchableOpacity>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: vw(3) }}>
                                <FastImage source={{ uri: API + image }} style={{ width: vw(8), height: vw(8), marginTop: vw(-2.5), borderRadius: vw(.5), marginRight: vw(1) }} />
                                <Text style={{ color: Style.defaultTxtColor, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1} >{name}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ justifyContent: 'center', position: 'absolute', left: vw(30) }}>
                        <TouchableOpacity>
                            <View style={[...[styles.timer], { width: vw(14), height: vw(4), marginBottom: vw(2) }]}>
                                <Text style={{ textAlign: 'center', color: '#fff', fontSize: vw(2.6), }}>{(hours < 10) ? `0${hours}` : `${hours}`}:{(mintues < 10) ? (`0${mintues}`) : `${mintues}`}:{(seconds < 10) ? (`0${seconds}`) : `${seconds}`}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ right: vw(0), position: 'absolute' }}>
                        <TouchableOpacity>
                            <LocalSvg
                                fill={'#00000000'}
                                width={20}
                                height={20}
                                asset={require('../../assets/bump.svg')}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    //Quib List
    const QuibList = useCallback(({ item, index }: any) => {
        let { hours, mintues, seconds } = getFormattedTime(item.time);

        if (!item.isScreenshot) {
            return (
                <View key={index} style={styles.flatlistContainer}>
                    <QuibHead hours={hours} mintues={mintues} seconds={seconds} image={item.avatarBase32ImagePath} isSS={item.isScreenshot} name={item.displayName} />
                    <View style={styles.flatlistComps}>
                        <Text style={{ color: Style.defaultTxtColor, }}>{item.body}</Text>
                    </View>
                </View>
            )
        }
        else {
            return (
                <View key={index} style={styles.flatlistContainer}>
                    <QuibHead hours={hours} mintues={mintues} seconds={seconds} isSS={item.isScreenshot} image={null} name={null} />
                    <View style={styles.flatlistComps}>
                        <FastImage
                            source={{
                                uri: API + item.body,
                                cache: FastImage.cacheControl.immutable,
                                priority: FastImage.priority.normal
                            }}
                            resizeMode={FastImage.resizeMode.contain}
                            style={{ width: vw(80), height: vw(40) }}
                        />
                    </View>
                </View>
            )
        }
    }, [])
    // intial Quib 
    const InitialQuib = () => {
        return (
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Style.borderColor

            }}
            >
                <View>
                    {/* <Text style={styles.heading}>Timeline quib for</Text> */}
                </View>
                <View>
                    <FastImage
                        style={styles.image}
                        source={{
                            // uri: `${API}${Poster}`,
                            uri: ((isPoster) ? `${API}${posterRef.current}` : `data:image/jpeg;base64,${posterRef.current}`),
                            priority: FastImage.priority.high,
                            cache: FastImage.cacheControl.immutable
                        }}
                    />
                </View>
            </View>
        )
    }

    const QuibCarouselModal = () => {
        if (isVisble == true) return (
            <View style={{
                flex: 1,
                justifyContent: 'center', alignItems: 'center', position: 'absolute', overflow: 'hidden',
                backgroundColor: 'rgba(4, 59, 92, 0.8 )', zIndex: 2, elevation: 2, height: vmax(),
            }}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ width: vw(100), height: vh(50), marginTop: vw(-90), alignSelf: 'center', backgroundColor: 'transparent' }}
                    contentContainerStyle={{ justifyContent: 'center', alignSelf: 'center', marginHorizontal: vw(2) }}
                    data={resMap.current}
                    renderItem={({ item, index }) => < QuibCarousel item={item} index={index} />}
                    initialNumToRender={10}
                    windowSize={5}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={30}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(_, index) => index.toString()}
                    initialScrollIndex={0}
                />
            </View>
        )
        else return null;
        // console.log(resMap.current);

        // return (
        //     <Modal
        // style={{ flexDirection: 'row', flex: 1, height: vh(90) }}
        // animationType="fade"
        // transparent={true}
        // visible={isVisble}
        // onRequestClose={() => {
        //     // Alert.alert("Modal has been closed.");
        //     setIsVisble(false)
        // }}
        //     >
        //         <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(4, 59, 92, 0.8 )', height: vh(89), marginTop: vh(7) }}>
        //             <FlatList
        //                 horizontal
        //                 showsHorizontalScrollIndicator={false}
        //                 style={{ width: vw(96), height: vh(60), marginTop: vw(-90), alignSelf: 'center' }}
        //                 contentContainerStyle={{ justifyContent: 'center', alignSelf: 'center', }}
        //                 data={resMap.current}
        //                 renderItem={({ item, index }) => < QuibCarousel item={item} index={index} />}
        //                 initialNumToRender={10}
        //                 windowSize={5}
        //                 maxToRenderPerBatch={10}
        //                 updateCellsBatchingPeriod={30}
        //                 showsVerticalScrollIndicator={false}
        //                 keyExtractor={(_, index) => index.toString()}
        //                 initialScrollIndex={0}
        //             />
        //         </View>
        //     </Modal>
        // )
    }
    const QuibComposeModal = () => {
        if (isVisbleModal == true) return (
            <View style={{
                flex: 1,
                justifyContent: 'center', alignItems: 'center', position: 'absolute', overflow: 'hidden',
                backgroundColor: 'rgba(4, 59, 92, 0.8 )', zIndex: 2, elevation: 2, height: vmax(), width:vmax(),
            }}>
                <QuibCompose hour={hours} mins={mintues} secs={seconds} />
            </View>
        )
        else return null;
    }
    return (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', backgroundColor: '#fff' }}>
            <View style={{ width: vw(100), zIndex: 3, elevation: 3, }}>

                <PageHeader
                    leftNode={
                        <View>
                            <TouchableOpacity activeOpacity={.5} onPress={() => navigation.goBack()}>
                                <FastImage
                                    source={{
                                        uri: ((isPoster) ? `${API}${posterRef.current}` : `data:image/png;base64,${posterRef.current}`),
                                        cache: FastImage.cacheControl.immutable,
                                    }}
                                    style={{ marginLeft: 5, width: 35, height: 45, borderRadius: 5 }} />
                            </TouchableOpacity>
                        </View>
                    }
                    headerNode={
                        //
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity activeOpacity={.5} onPress={DecSecond}>
                                <Icon name='minus-circle-outline' size={32} color={Style.defaultRed} />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={.5} onPress={() => setIsVisbleModal(true)}>
                                <View style={styles.timer}>
                                    <Text style={{ textAlign: 'center', color: '#fff' }}>{(hours < 10) ? `0${hours}` : `${hours}`}:{(mintues < 10) ? (`0${mintues}`) : `${mintues}`}:{(seconds < 10) ? (`0${seconds}`) : `${seconds}`}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={.5} onPress={IncSecond}>
                                <Icon name='plus-circle-outline' size={32} color={Style.defaultRed} />
                            </TouchableOpacity>
                        </View>
                    }
                    rightNode={
                        <TouchableOpacity activeOpacity={.5} onPress={() => { toggle(); }} hitSlop={{ bottom: 10, left: 20, right: 10, top: 10 }}>
                            <Icon name={PlayPause} size={40} color={Style.defaultRed} />
                        </TouchableOpacity>

                    }
                />
            </View>

            {/* Quibs flatlist */}
            {/* Quibs flatlist */}
            {/* Quibs flatlist */}
            {/* Quibs flatlist */}
            {/* Quibs flatlist */}
            <View style={styles.container}>
                {/*modal*/}
                {/*modal*/}
                {/*modal*/}
                {/*modal*/}
                <QuibComposeModal />
                <QuibCarouselModal />


                {/* Quib List */}
                {/* Quib List */}
                {/* Quib List */}
                {/* Quib List */}
                <FlatList
                    data={movieQuib}
                    initialNumToRender={10}
                    windowSize={5}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={30}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={InitialQuib}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={QuibList}
                    initialScrollIndex={0}
                    ref={flatRef}
                    onScrollToIndexFailed={(error) => {
                        flatRef.current?.scrollToOffset({ offset: error.averageItemLength * error.index, animated: true });
                        setTimeout(() => {
                            if (DATA.length !== 0 && flatRef !== null) {
                                flatRef.current?.scrollToIndex({ index: error.index, animated: true });
                            }
                        }, 100)
                    }}

                />
            </View>
            {/* Quib timeline */}
            {/* Quib timeline */}
            {/* Quib timeline */}
            {/* Quib timeline */}
            <View style={{ position: 'absolute', bottom: 0, width: vw(100), flexDirection: 'column', backgroundColor: Style.quibColor, height: vh(10), zIndex: 3, elevation: 3, }}>
                <View style={styles.quibScrubber}>
                    <View style={{ ...styles.quibZero, marginRight: vw(0) }}>
                        <TouchableOpacity onPress={() => setIsVisble(!isVisble)}>
                            <LocalSvg
                                style={{}}
                                width={vw(10)}
                                height={vw(10)}
                                asset={require('../../assets/SVG/carousel-off.svg')}
                            />
                        </TouchableOpacity>
                    </View>
                    {/*quib Scrubber*/}
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginLeft: vw(2), paddingTop: vw(3), }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Slider
                                maximumValue={MovieLen.current}
                                minimumTrackTintColor='#00000000'
                                maximumTrackTintColor='#00000000'
                                // minimumTrackTintColor={Style.defaultRed}
                                // maximumTrackTintColor={Style.defaultTxtColor}
                                containerStyle={{ width: vw(70), }}
                                value={QuibTime}
                                trackClickable={false}
                                step={1}
                                onSlidingComplete={value => {
                                    value = Array.isArray(value) ? value[0] : value;
                                    setQuibTime(value);
                                    const Reduce = DATA.reduce((accumulator, current) => {
                                        const val = Array.isArray(value) ? value[0] : value;
                                        return Math.abs(current.Time - val) < Math.abs(accumulator.Time - val) ? (current) : (accumulator);
                                    })
                                    const ScurbIndex = DATA.findIndex((item, index) => {
                                        if (item.Time == Reduce.Time) {
                                            quibScrubIndexRef.current = index;
                                            return index;
                                        }
                                    })
                                    if (ScurbIndex < 0) {
                                        flatRef.current?.scrollToOffset({
                                            animated: true,
                                            offset: 0
                                        })
                                    }
                                    else {
                                        flatRef.current?.scrollToIndex({
                                            animated: true,
                                            index: ScurbIndex
                                        })
                                    }
                                }}
                                renderThumbComponent={() => {
                                    if (!AllSync) {

                                        if (QuibTime == MovieTime) {
                                            return <Image source={require('../../assets/bottom.png')}
                                                style={{ width: vw(4), marginLeft: vw(-3), left: vw(2.5), height: vw(4), resizeMode: 'contain', bottom: vw(1.4), }}
                                            />
                                        } else return <Image source={require('../../assets/bottom_line.png')}
                                            style={{ width: vw(4), marginLeft: vw(-3), left: vw(2.5), height: vw(4), resizeMode: 'contain', bottom: vw(1.4), }}
                                        />
                                    } else return null
                                }}
                                trackStyle={{ marginLeft: vw(1), }}
                                animateTransitions={true}
                            />
                        </View>

                        {/* Movie Scrubber  */}
                        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: vw(-13) }}>
                            <Slider
                                maximumValue={MovieLen.current}
                                minimumTrackTintColor={Style.defaultRed}
                                maximumTrackTintColor={Style.defaultTxtColor}
                                containerStyle={{ width: vw(70), }}
                                value={MovieTime}
                                trackClickable={true}
                                step={1}
                                // onValueChange={value => {
                                //     value = Array.isArray(value) ? value[0] : value;
                                //     setMovieTime(value);
                                // }}
                                onSlidingComplete={async (value) => {
                                    value = Array.isArray(value) ? value[0] : value;
                                    setQuibTime(value);
                                    setMovieTime(value);
                                    const Reduce = DATA.reduce((accumulator, current) => {
                                        const val = Array.isArray(value) ? value[0] : value;
                                        return Math.abs(current.Time - val) < Math.abs(accumulator.Time - val) ? (current) : (accumulator);
                                    })
                                    const ScurbIndex = DATA.findIndex((item, index) => {
                                        if (item.Time == Reduce.Time) {
                                            quibScrubIndexRef.current = index;
                                            return index;
                                        }
                                    })
                                    if (ScurbIndex < 0) {
                                        flatRef.current?.scrollToOffset({
                                            animated: true,
                                            offset: 0
                                        })
                                    }
                                    else {
                                        flatRef.current?.scrollToIndex({
                                            animated: true,
                                            index: ScurbIndex
                                        })
                                    }
                                }}
                                renderThumbComponent={() => {
                                    if (!AllSync) {
                                        return <Image source={require('../../assets/top.png')}
                                            style={{ width: vw(4), marginLeft: vw(-3), left: vw(2.5), height: vw(4), resizeMode: 'contain', bottom: vw(2.4), }}
                                        />
                                    } else return (
                                        <TouchableOpacity style={{ paddingRight: vw(.5), overflow: 'hidden' }}>
                                            <LocalSvg
                                                style={{ marginLeft: vw(-21.5), left: vw(11.5), bottom: vw(-1.1), }}
                                                width={vw(25)}
                                                height={vw(25)}
                                                asset={require('../../assets/all-sync-mode.svg')}
                                            />
                                        </TouchableOpacity>

                                    )
                                }}
                                trackStyle={{ marginLeft: vw(1), }}
                                animateTransitions={true}
                            // thumbTouchSize={}
                            />
                        </View>
                    </View>
                    <View style={{ justifyContent: 'center', flex: 1, marginLeft: vw(3), width: vw(10), height: vw(10) }} >

                        {/* quib sunc butttons*/}
                        <SyncButton isSync={AllSync} isMovieSync={false} onPress={SyncTime} onLongPress={() => setAllSync(!AllSync)} />

                        {/* <Icon name='sync' size={30} color={Style.defaultRed} style={{ textAlign: 'center', }} /> */}
                    </View>
                </View>
                {/* handles the title for the movie */}
                <View style={{ flex: 1, flexDirection: 'row', marginBottom: vw(1.5), marginTop: vw(-1.5) }}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ ...styles.heading, fontSize: 20 }}>{Movietitle}</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        width: vw(95),
        // overflow: 'hidden',
        padding: vw(3),
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        // marginBottom:-80,
        color: Style.defaultTxtColor,
    },
    image: {
        resizeMode: 'contain',
        width: vw(70),
        height: vh(50),
        margin: vw(5)
    },
    quibScrubber: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: vw(3),
        paddingTop: vw(1.5),
        paddingBottom: vw(1.5)
    },
    quibZero: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timer: {
        marginHorizontal: vw(3),
        backgroundColor: Style.defaultRed,
        width: vw(25),
        flexDirection: 'row',
        height: vw(6),
        borderRadius: vw(5),
        alignItems: 'center',
        justifyContent: 'center',
    },
    flatlistComps: {
        paddingVertical: vw(2),
    },
    flatlistContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Style.borderColor,
        paddingVertical: vw(1),
        paddingHorizontal: vw(3),
        marginVertical: vw(3),
    }
})