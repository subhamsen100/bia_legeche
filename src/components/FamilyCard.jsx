/* FamilyCard: arch portrait + full name + "Son/Daughter of ..." line.
   layout: 'column' (portrait above text), 'row' (portrait left), 'rowReverse' (portrait right).
   archDelay (s): the ArchFrame mounts after this delay so its bloom plays then
   (a same-size placeholder holds the space meanwhile). textDelay (s): text fade-up. */
import { memo } from 'react';
import { motion } from 'framer-motion';
import config from '../config.js';
import { BilingualText } from './BilingualText.jsx';
import { PortraitCard } from './PortraitCard.jsx';
import { EASE, useAfter } from './SceneKit.jsx';
import styles from './FamilyCard.module.css';

export const FamilyCard = memo(function FamilyCard({
  kind = 'groom',
  layout = 'column',
  bloom = true,
  archDelay = 0,
  textDelay = 0,
  animate = true,
  headingAs = 'h2',
  className = '',
}) {
  const person = config.couple[kind];
  const mounted = useAfter(animate ? archDelay : 0);
  const Heading = headingAs;

  return (
    <article className={`${styles.card} ${styles[layout] || ''} ${className}`} data-family={kind}>
      <div className={styles.arch}>
        {mounted ? <PortraitCard kind={kind} bloom={bloom && animate} /> : <div className={styles.placeholder} />}
      </div>
      <motion.div
        className={styles.text}
        initial={animate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: animate ? textDelay : 0 }}
      >
        <Heading className={styles.name} data-perch="">
          <BilingualText as="span" text={person.fullName} variant="display" className={styles.nameText} />
        </Heading>
        <span className={styles.tick} aria-hidden="true" />
        <BilingualText
          text={config.couple.familyLine}
          vars={{ relation: person.relation, father: person.father, mother: person.mother }}
          variant="body"
          className={styles.line}
        />
      </motion.div>
    </article>
  );
});

export default FamilyCard;
