import { motion } from "framer-motion";

type Props= {
    onStart:()=>void
}
const StartScreen = ({ onStart }:Props) => {
  return (
    <motion.div
    className="absolute  w-full h-full right-0 top-[-3.3%] md:-top-[0.5%] overflow-hidden"
    style={{ cursor: "pointer" }}
    onClick={onStart}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.35 }}
  >
   <div className="bg-[#01313CC2] h-full flex items-center justify-center">
    {/* <div className="bg-url(url('/assets/'))" aria-hidden/> */}
      <div className="bg-[#FFC0B7] w-full inline-flex justify-center py-[12px]">
        <button className="font-playfair text-[23px]">START NOW</button>
      </div>
   </div>
    </motion.div>
    
  )
}

export default StartScreen