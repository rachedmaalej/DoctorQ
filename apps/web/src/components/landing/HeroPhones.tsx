import IPhoneFrame from './IPhoneFrame';
import DoctorSlideshow from './DoctorSlideshow';
import PatientSlideshow from './PatientSlideshow';
import FloatingBubble from './FloatingBubble';

export default function HeroPhones() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Doctor phone — slight left tilt */}
      <div className="lg:-rotate-3 lg:translate-y-3 z-[1]">
        <IPhoneFrame className="w-[140px] sm:w-[160px] md:w-[170px] lg:w-[185px] xl:w-[200px]">
          <DoctorSlideshow />
        </IPhoneFrame>
      </div>

      {/* Patient phone — slight right tilt, overlapping */}
      <div className="lg:rotate-2 lg:-translate-y-2 -ml-3 sm:-ml-4 lg:-ml-5 z-[2]">
        <IPhoneFrame className="w-[140px] sm:w-[160px] md:w-[170px] lg:w-[185px] xl:w-[200px]">
          <PatientSlideshow />
        </IPhoneFrame>
      </div>

      {/* Floating "Patient satisfait" bubble — bottom-right */}
      <FloatingBubble
        className="absolute -bottom-4 -right-6 z-10 hero-float-anim-delayed"
      />
    </div>
  );
}
