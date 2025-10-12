import { useProgress } from '@react-three/drei'

const GuitarLoader = (props) => {
  const { progress } = useProgress();
  const { ...styleProps } = props;

  return(
      <div 
        className={`loader ${progress === 100 ? 'hidden' : ''} ${props.className}`}
        style={{
          ...styleProps
        }}
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
        <img src="/images/output-onlinepngtools.png" alt="Logo" style={{
          maxWidth: '250px',
          maxHeight: '250px',
          objectFit: 'contain',
          display: 'block',
          rotate: "-90deg",
        }}/>
      </div>
  )
}

export default GuitarLoader;