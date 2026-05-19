import Image from "next/image";
import styles from "../../styles/patient-landing/sections/PatientBranchSocialCard.module.css";

export type PatientBranchSocialLink = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

type PatientBranchSocialCardProps = {
  branchName: string;
  links: PatientBranchSocialLink[];
};

const BOX_CLASS_NAMES = [styles.box1, styles.box2, styles.box3, styles.box4];

const PatientBranchSocialCard = ({ branchName, links }: PatientBranchSocialCardProps) => {
  const availableLinks = links.filter((link) => Boolean(link.href)).slice(0, 4);
  if (availableLinks.length === 0) return null;

  return (
    <div className={styles.card} role="group" aria-label={`Redes sociales de ${branchName}`}>
      <div className={styles.background} aria-hidden="true" />

      <div className={styles.logo} aria-hidden="true">
        {/* Icono de red de nodos / conexion social */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.logoSvg} aria-hidden="true">
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="19" cy="5" r="2.5" />
          <circle cx="19" cy="19" r="2.5" />
          <line x1="7.2" y1="11" x2="17" y2="6.2" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7.2" y1="13" x2="17" y2="17.8" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>

      {availableLinks.map((social, index) => (
        <a
          key={social.key}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.box} ${BOX_CLASS_NAMES[index] || styles.box4}`}
          title={social.label}
          aria-label={social.label}
        >
          <span className={styles.icon}>
            <Image src={social.icon} alt={social.label} width={22} height={22} className={styles.svg} />
          </span>
        </a>
      ))}
    </div>
  );
};

export default PatientBranchSocialCard;