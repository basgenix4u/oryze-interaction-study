import Image from "next/image";
import { MobileFrame } from "@/components/study/MobileFrame";
import { RelanceCard } from "@/components/study/RelanceCard";
import { SectionLabel } from "@/components/study/SectionLabel";
import { OryzeRing } from "@/components/ui/OryzeRing";

export default function HomePage() {
  return (
    <div className="site-shell mx-auto w-full">
      <header className="site-header">
        <div className="site-header__inner mx-auto flex w-full items-center justify-between">
          <div className="brand-lockup">
            <Image
              alt="Oryze"
              className="brand-lockup__wordmark"
              height={364}
              priority
              src="/oryze-logo-color.png"
              width={1600}
            />
            <span aria-hidden="true" className="brand-lockup__divider" />
            <OryzeRing className="brand-lockup__ring" progress={1} size={25} variant="full" />
            <span className="brand-lockup__caption">Étude<br />d'interaction</span>
          </div>
          <p className="header-index mono">
            <span className="header-index__range">01—04</span>
            <span aria-hidden="true" className="header-index__divider">/</span>
            <span className="header-index__topic">RELANCE</span>
          </p>
        </div>
      </header>

      <main className="page-content">
        <section aria-labelledby="study-title" className="study-section study-section--demo" id="demo">
          <SectionLabel label="La démonstration" number="01" />
          <div className="demo-grid">
            <div className="demo-intro">
              <p className="demo-intro__eyebrow">Une action, une trace</p>
              <h1 id="study-title">Le geste complète votre marque.</h1>
              <p className="demo-intro__lead">
                Le bouton n'affiche pas un spinner. Il montre Oryze qui se termine.
              </p>
              <p className="demo-intro__instruction">
                Maintiens une seconde. Relâche avant la fin pour annuler.
              </p>
              <div className="gesture-summary">
                <div className="gesture-summary__item">
                  <span>Maintien</span>
                  <strong className="mono">1,0 s</strong>
                </div>
                <span aria-hidden="true" className="gesture-summary__rule" />
                <div className="gesture-summary__item">
                  <span>Annulation</span>
                  <strong>au relâchement</strong>
                </div>
              </div>
              <p className="demo-limitation">
                Démonstration locale · aucun message n'est envoyé
              </p>
            </div>
            <RelanceCard />
          </div>
        </section>

        <section aria-labelledby="idea-title" className="study-section" id="idee">
          <SectionLabel label="L'idée" number="02" />
          <div className="idea-statement">
            <h2 id="idea-title">
              <span>« Tu traces chaque chiffre.</span>
              <span className="idea-statement__highlight">Trace aussi le geste. »</span>
            </h2>
            <p>— parce que le geste qui écrit la trace est le seul qu'on ne peut pas défaire</p>
          </div>

          <div className="table-frame">
            <table className="study-table study-table--reasons">
              <caption className="visually-hidden">Pourquoi cette interaction plutôt qu'un autre bouton</caption>
              <thead className="visually-hidden">
                <tr><th scope="col">Raison</th><th scope="col">Ce que le geste engage</th></tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">L'IA prépare</th>
                  <td>
                    Oryze Intelligence a rédigé le message. La doctrine du produit le dit ainsi :
                    <span className="quote-inline"> « Elle prépare. Vous décidez. »</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">L'humain décide</th>
                  <td>
                    Le produit dit « vous décidez ». <span className="mono">1,0 s</span> de maintien,
                    c'est le poids de cette décision quand sa conséquence sort de l'écran.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Le prix est relationnel</th>
                  <td>
                    Une relance part vers ton client, sous ton nom. Un virement peut parfois être
                    rappelé. Un message lu ne peut pas l'être.
                  </td>
                </tr>
                <tr>
                  <th scope="row">La trace existe déjà</th>
                  <td>
                    L'interface affiche déjà « Relance 1 · tracée ». Le geste doit produire la ligne
                    que l'on relira, pas seulement la précéder.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="touch-title" className="study-section" id="au-doigt">
          <SectionLabel label="Au doigt" number="03" />
          <div className="section-heading">
            <h2 id="touch-title">Le maintien reste visible et réversible.</h2>
            <p>Sur ton téléphone, le contact est tout ce qu'il reste. Le geste doit répondre au doigt et céder au mouvement.</p>
          </div>

          <div className="touch-grid">
            <MobileFrame />
            <div className="table-frame table-frame--tactile">
              <table className="study-table study-table--decisions">
                <caption className="visually-hidden">Décisions tactiles du maintien</caption>
                <tbody>
                  <tr>
                    <th scope="row">Déclencheur</th>
                    <td>
                      Sur Expo, <code>onPressIn</code> ; sur le web, <code>pointerdown</code>. Jamais
                      <code> onMouseDown</code>, qui arrive après le doigt.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Maintien</th>
                    <td><code>0,9 s</code> au toucher · <code>1,0 s</code> au pointeur.</td>
                  </tr>
                  <tr>
                    <th scope="row">Amplitude</th>
                    <td><code>4 px</code> sur mobile · <code>3 px</code> sur le web : le doigt couvre le déplacement.</td>
                  </tr>
                  <tr>
                    <th scope="row">Annulation</th>
                    <td>Doigt qui glisse, appel entrant ou défilement : la relance ne part pas.</td>
                  </tr>
                  <tr>
                    <th scope="row">Haptique</th>
                    <td>
                      <code>impactAsync(Light)</code> au contact · <code>notificationAsync(Success)</code> à la fin ·
                      <code> Warning</code> à l'annulation.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Accessibilité</th>
                    <td>
                      Le maintien fonctionne avec Espace ou Entrée. Dans l'app Expo, l'action « Envoyer » reste
                      disponible pour VoiceOver et TalkBack.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="system-title" className="study-section study-section--system" id="dans-votre-systeme">
          <SectionLabel label="Dans votre système" number="04" />
          <div className="section-heading">
            <h2 id="system-title">Une prop. Des états explicites.</h2>
            <p>Le composant s'étend sans changer le comportement des boutons qui n'en ont pas besoin.</p>
          </div>

          <div className="table-frame">
            <table className="study-table study-table--system">
              <caption className="visually-hidden">Éléments nécessaires à l'adoption dans le système Oryze</caption>
              <tbody>
                <tr>
                  <th scope="row"><code>&lt;Button holdToConfirm=&#123;1000&#125; /&gt;</code></th>
                  <td>Une prop optionnelle. Sans elle, <code>Button</code> garde son comportement de clic actuel.</td>
                </tr>
                <tr>
                  <th scope="row"><code>phase</code></th>
                  <td><code>'idle' | 'hold' | 'working' | 'done' | 'cancelled' | 'failed'</code></td>
                </tr>
                <tr>
                  <th scope="row"><code>--press-in: 0.05s</code></th>
                  <td>L'appui, plus rapide que <code>--dur-fast</code>, qui reste pour le relâchement.</td>
                </tr>
                <tr>
                  <th scope="row"><code>--dur-hold: 1.0s</code></th>
                  <td>La durée de la décision.</td>
                </tr>
                <tr>
                  <th scope="row"><code>--action-primary-pressed</code></th>
                  <td>Le pendant pressé de <code>--action-primary-hover</code> ; un nom distinct, sans nouvelle teinte.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <aside className="closing-note">
            <p>
              Tu construis avec Claude et Codex, et ton design system vit dans Claude. Une règle
              d'interaction écrite sans ambiguïté — durée, courbe, condition d'annulation, état produit par
              le geste — aide un agent à prolonger le système sans réinventer le comportement de chaque
              composant. Chez toi, une règle bien spécifiée sert deux fois : aux personnes qui utilisent
              l'interface et aux agents qui la prolongent.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
