import { useProgress } from '@react-three/drei'

const Loader = () => {
  const { progress } = useProgress();

  return(
    <>
      <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          zIndex: 101,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className={`loader ${progress === 100 && 'hidden'}`}
      >
        <div style={{width: "250px", height: "0px"}}>
          <div style={{
            minWidth: '110px',
            minHeight: '110px',
            marginTop: "70px",
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'end',
            backgroundColor: 'white',
          }}>
            <div
              style={{
                minHeight: `${progress * 1.1}px`,
                minWidth: '250px',
                backgroundColor: 'blue',
                color: 'white',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'min-height 0.3s cubic-bezier(.4,2,.6,1)',
                fontWeight: 700,
                fontSize: '1.2em',
              }}
            />
          </div>
        </div>
        <img src="/output-onlinepngtools.png" alt="Logo" style={{
          maxWidth: '250px',
          maxHeight: '250px',
          objectFit: 'contain',
          display: 'block',
          rotate: "-90deg",
          display: "flex", 
          flexDirection: "column",
          alignContent: "start",
          justifyContent: "start"
        }}/>
      </div>
    </>
  )
}

export default Loader;