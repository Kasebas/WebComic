import { Injectable } from '@angular/core';
import { Story } from 'inkjs';
import { BehaviorSubject, Observable } from 'rxjs';

export interface InteractiveStoryState {
  storyId: string;
  currentText: string;
  choices: Choice[];
  variables: { [key: string]: any };
  canContinue: boolean;
  isComplete: boolean;
  currentTags: string[];
}

export interface Choice {
  index: number;
  text: string;
}

export interface StoryProgress {
  storyId: string;
  saveState: string;
  timestamp: Date;
  chapterProgress: number;
}

@Injectable({
  providedIn: 'root'
})
export class InteractiveStoryService {
  private currentStory: Story | null = null;
  private storyStateSubject = new BehaviorSubject<InteractiveStoryState | null>(null);
  private storyProgressMap = new Map<string, StoryProgress>();

  public storyState$ = this.storyStateSubject.asObservable();

  constructor() {
    this.loadProgressFromStorage();
  }

  // Initialize a story from Ink JSON
  async initializeStory(storyId: string, inkJsonPath: string): Promise<void> {
    try {
      // Load the Ink story JSON
      const response = await fetch(inkJsonPath);
      const storyJson = await response.json();

      // Create new Story instance
      this.currentStory = new Story(storyJson);

      // Load saved progress if exists
      const savedProgress = this.storyProgressMap.get(storyId);
      if (savedProgress) {
        this.currentStory.state.LoadJson(savedProgress.saveState);
      }

      // Update state
      this.updateStoryState(storyId);

    } catch (error) {
      console.error('Error initializing story:', error);
      throw error;
    }
  }

  // Initialize a story from predefined content (for demos)
  async initializeDemoStory(storyId: string): Promise<void> {
    try {
      // For simplicity, we'll create a mock story with predefined states
      // In a real implementation, you'd use actual Ink compiled JSON
      this.createMockInteractiveStory(storyId);
      this.updateStoryState(storyId);

    } catch (error) {
      console.error('Error initializing demo story:', error);
      throw error;
    }
  }

  // Create a mock interactive story for demonstration
  private createMockInteractiveStory(storyId: string): void {
    // Set the current story to null to simulate a story object
    this.currentStory = null;

    // We'll simulate the story progression with predefined content
    const mockStoryState: InteractiveStoryState = {
      storyId,
      currentText: this.getStoryIntro(storyId),
      choices: this.getInitialChoices(storyId),
      variables: {},
      canContinue: false,
      isComplete: false,
      currentTags: ['demo', 'interactive']
    };

    this.storyStateSubject.next(mockStoryState);
  }

  private getStoryIntro(storyId: string): string {
    switch (storyId) {
      case 'space-adventure-mission-1':
        return 'Te encuentras en una nave espacial. El comando te ha dado una misión crítica de exploración. Los sistemas están operativos y el espacio te espera. ¿Cuál será tu primer movimiento?';
      case 'space-adventure-encounter':
        return 'Una nave extraterrestre aparece frente a ti en el espacio profundo. Sus intenciones son desconocidas y la tensión es palpable. Esta decisión podría cambiar el curso de la historia humana.';
      case 'mystery-investigation':
        return 'Eres un detective privado. El Dr. Elena Voss ha desaparecido misteriosamente y su laboratorio está en desorden. La policía no encuentra pistas, pero tú tienes la sensación de que hay más de lo que aparenta.';
      case 'fantasy-adventure':
        return 'En el reino de Aethermoor, eres un aventurero novato. La princesa ha sido secuestrada y llevada a la Torre Sombría. El rey ofrece una gran recompensa, pero el peligro es real.';
      default:
        return 'Te despiertas en una habitación extraña. La luz tenue revela una puerta cerrada y una ventana. Tu corazón late rápido mientras evalúas tus opciones.';
    }
  }

  private getInitialChoices(storyId: string): Choice[] {
    switch (storyId) {
      case 'space-adventure-mission-1':
        return [
          { index: 0, text: 'Revisar la misión en detalle' },
          { index: 1, text: 'Verificar los sistemas de la nave' },
          { index: 2, text: 'Contactar con el comando' }
        ];
      case 'space-adventure-encounter':
        return [
          { index: 0, text: 'Intentar comunicarse pacíficamente' },
          { index: 1, text: 'Preparar las defensas' },
          { index: 2, text: 'Retirarse lentamente' }
        ];
      case 'mystery-investigation':
        return [
          { index: 0, text: 'Examinar el laboratorio detalladamente' },
          { index: 1, text: 'Entrevistar a sus colegas' },
          { index: 2, text: 'Revisar su computadora personal' }
        ];
      case 'fantasy-adventure':
        return [
          { index: 0, text: 'Ir directamente a la Torre Sombría' },
          { index: 1, text: 'Buscar aliados en la taberna' },
          { index: 2, text: 'Comprar equipo en el mercado' }
        ];
      default:
        return [
          { index: 0, text: 'Explorar la habitación cuidadosamente' },
          { index: 1, text: 'Intentar abrir la puerta' },
          { index: 2, text: 'Mirar por la ventana' }
        ];
    }
  }

  private getSpaceMissionStory(): string {
    return `
      === start ===
      Te encuentras en una nave espacial. El comando te ha dado una misión crítica.
      ¿Qué decides hacer primero?

      * [Revisar la misión en detalle] -> review_mission
      * [Verificar los sistemas de la nave] -> check_systems
      * [Contactar con el comando] -> contact_command

      === review_mission ===
      Tu misión es explorar el sector 7 y buscar señales de vida extraterrestre.
      Los sensores detectan una anomalía en el planeta más cercano.

      * [Investigar el planeta] -> investigate_planet
      * [Escanear desde la distancia] -> scan_distance

      === check_systems ===
      Todos los sistemas están funcionando correctamente.
      Sin embargo, notas que el combustible está al 70%.

      * [Proceder con la misión] -> proceed_mission
      * [Regresar a recargar combustible] -> return_refuel

      === investigate_planet ===
      ¡Encuentras ruinas de una civilización antigua!
      Tu descubrimiento cambiará la historia de la humanidad.
      -> END

      === scan_distance ===
      Los escaneos revelan minerales raros en el planeta.
      Has encontrado recursos valiosos para la Tierra.
      -> END

      === proceed_mission ===
      Decides continuar. Tu determinación te lleva a descubrir una nueva ruta comercial.
      -> END

      === return_refuel ===
      Regresas de manera segura. La precaución es a veces la mejor estrategia.
      -> END
    `;
  }

  private getSpaceEncounterStory(): string {
    return `
      === start ===
      Una nave extraterrestre aparece frente a ti.
      Sus intenciones son desconocidas. ¿Cómo respondes?

      * [Intentar comunicarse] -> communicate
      * [Preparar las defensas] -> prepare_defense
      * [Retirarse lentamente] -> retreat

      === communicate ===
      Envías señales de paz. Los aliens responden con curiosidad.
      Logras establecer un primer contacto histórico.

      * [Intercambiar conocimientos] -> exchange_knowledge
      * [Invitarlos a visitar la Tierra] -> invite_earth

      === prepare_defense ===
      Activas los escudos. Los aliens interpretan esto como hostilidad
      y se retiran. Has perdido una oportunidad única.
      -> END

      === retreat ===
      Te alejas lentamente. Los aliens te siguen a distancia,
      mostrando curiosidad pero respetando tu espacio.
      -> END

      === exchange_knowledge ===
      El intercambio de conocimientos beneficia a ambas especies.
      Has iniciado una nueva era de cooperación intergaláctica.
      -> END

      === invite_earth ===
      Los aliens aceptan tu invitación. La humanidad está a punto
      de unirse a una comunidad galáctica más amplia.
      -> END
    `;
  }

  // Continue the story (when there are no choices)
  continueStory(): void {
    if (!this.currentStory) return;

    if (this.currentStory.canContinue) {
      this.currentStory.Continue();
      this.updateCurrentStoryState();
    }
  }

  // Make a choice in the story
  makeChoice(choiceIndex: number): void {
    if (!this.currentStory) return;

    if (choiceIndex >= 0 && choiceIndex < this.currentStory.currentChoices.length) {
      this.currentStory.ChooseChoiceIndex(choiceIndex);
      this.updateCurrentStoryState();
    }
  }

  // Get story variable value
  getVariable(variableName: string): any {
    if (!this.currentStory) return null;
    return this.currentStory.variablesState.$(variableName);
  }

  // Set story variable value
  setVariable(variableName: string, value: any): void {
    if (!this.currentStory) return;
    this.currentStory.variablesState.$(variableName, value);
  }

  // Save current story progress
  saveProgress(storyId: string): void {
    if (!this.currentStory) return;

    const saveState = this.currentStory.state.ToJson();
    const progress: StoryProgress = {
      storyId,
      saveState,
      timestamp: new Date(),
      chapterProgress: this.calculateProgress()
    };

    this.storyProgressMap.set(storyId, progress);
    this.saveProgressToStorage();
  }

  // Load story progress
  loadProgress(storyId: string): StoryProgress | null {
    return this.storyProgressMap.get(storyId) || null;
  }

  // Reset story to beginning
  resetStory(storyId: string): void {
    if (!this.currentStory) return;

    this.currentStory.ResetState();
    this.storyProgressMap.delete(storyId);
    this.saveProgressToStorage();
    this.updateStoryState(storyId);
  }

  // Get all available story paths/branches
  getStoryPaths(): string[] {
    if (!this.currentStory) return [];

    // This would need to be implemented based on your story structure
    // For now, return current tags which can represent paths/branches
    return this.currentStory.currentTags || [];
  }

  // Check if story has interactive elements
  hasInteractiveElements(): boolean {
    if (!this.currentStory) return false;
    return this.currentStory.currentChoices.length > 0 || this.currentStory.canContinue;
  }

  // Get story statistics
  getStoryStats(storyId: string): any {
    const progress = this.storyProgressMap.get(storyId);
    return {
      hasProgress: !!progress,
      lastPlayed: progress?.timestamp,
      progressPercentage: progress?.chapterProgress || 0,
      isInteractive: this.hasInteractiveElements()
    };
  }

  private updateStoryState(storyId: string): void {
    if (!this.currentStory) {
      this.storyStateSubject.next(null);
      return;
    }

    const state: InteractiveStoryState = {
      storyId,
      currentText: this.getCurrentText(),
      choices: this.getCurrentChoices(),
      variables: this.getAllVariables(),
      canContinue: this.currentStory.canContinue,
      isComplete: !this.currentStory.canContinue && this.currentStory.currentChoices.length === 0,
      currentTags: this.currentStory.currentTags || []
    };

    this.storyStateSubject.next(state);
  }

  private updateCurrentStoryState(): void {
    const currentState = this.storyStateSubject.value;
    if (currentState) {
      this.updateStoryState(currentState.storyId);
    }
  }

  private getCurrentText(): string {
    if (!this.currentStory) return '';

    let text = '';
    while (this.currentStory.canContinue) {
      text += this.currentStory.Continue();
    }
    return text.trim();
  }

  private getCurrentChoices(): Choice[] {
    if (!this.currentStory) return [];

    return this.currentStory.currentChoices.map((choice, index) => ({
      index,
      text: choice.text
    }));
  }

  private getAllVariables(): { [key: string]: any } {
    if (!this.currentStory) return {};

    const variables: { [key: string]: any } = {};

    // Note: InkJS doesn't provide direct access to all variables
    // You might need to track important variables manually
    // For now, we'll return an empty object

    return variables;
  }

  private calculateProgress(): number {
    // This is a simplified progress calculation
    // In a real implementation, you might want to track story nodes/chapters
    if (!this.currentStory) return 0;

    // You could implement this based on story structure
    // For now, return a placeholder
    return 50; // 50% as placeholder
  }

  private saveProgressToStorage(): void {
    try {
      const progressArray = Array.from(this.storyProgressMap.entries());
      localStorage.setItem('webcomic-interactive-progress', JSON.stringify(progressArray));
    } catch (error) {
      console.error('Error saving interactive story progress:', error);
    }
  }

  private loadProgressFromStorage(): void {
    try {
      const saved = localStorage.getItem('webcomic-interactive-progress');
      if (saved) {
        const progressArray = JSON.parse(saved);
        this.storyProgressMap = new Map(progressArray.map(([key, value]: [string, any]) => [
          key,
          { ...value, timestamp: new Date(value.timestamp) }
        ]));
      }
    } catch (error) {
      console.error('Error loading interactive story progress:', error);
    }
  }

  // Demo method to create a sample Ink story
  createDemoStory(): string {
    // Return a simple Ink story content as string
    return `
      === start ===
      Te despiertas en una habitación extraña. ¿Qué haces?

      * [Explorar la habitación] -> explore_room
      * [Buscar una salida] -> find_exit

      === explore_room ===
      Decides explorar la habitación cuidadosamente.
      Encuentras una llave bajo la almohada.

      * [Usar la llave en la puerta] -> use_key
      * [Guardar la llave y seguir explorando] -> continue_explore

      === find_exit ===
      Te diriges directamente hacia la puerta.
      Está cerrada con llave, pero hay una ventana.

      * [Intentar salir por la ventana] -> window_escape
      * [Buscar otra salida] -> search_exit

      === use_key ===
      La llave funciona! La puerta se abre y revela un pasillo largo.
      Has encontrado tu camino hacia la libertad.
      -> END

      === continue_explore ===
      Sigues explorando y encuentras un mapa del edificio.
      Ahora sabes exactamente cómo salir.
      -> END

      === window_escape ===
      La ventana está en un segundo piso, pero logras bajar safely.
      Has escapado con éxito!
      -> END

      === search_exit ===
      Después de buscar, encuentras una puerta secreta detrás de un cuadro.
      Conduce a un túnel que te lleva a la libertad.
      -> END
    `;
  }

  // Get demo story content for mystery investigation
  private getMysteryStory(): string {
    return `
      === start ===
      ~ detective_skill = 0
      ~ evidence_found = 0
      ~ suspect_trust = 50

      Eres un detective privado investigando la desaparición misteriosa del Dr. Elena Voss,
      una brillante científica que trabajaba en un proyecto clasificado.

      Su laboratorio fue encontrado en desorden, pero sin signos de lucha.

      * [Examinar el laboratorio detalladamente] -> examine_lab
      * [Entrevistar a sus colegas] -> interview_colleagues
      * [Revisar su computadora personal] -> check_computer

      === examine_lab ===
      ~ detective_skill += 1
      ~ evidence_found += 1

      Examinas cada rincón del laboratorio. Encuentras una nota parcialmente quemada
      que menciona "Proyecto Helix" y coordenadas misteriosas.

      También notas que falta un dispositivo específico del inventario.

      * [Investigar el Proyecto Helix] -> investigate_helix
      * [Buscar el dispositivo faltante] -> find_device
      * [Analizar las coordenadas] -> analyze_coordinates

      === interview_colleagues ===
      ~ suspect_trust += 10

      Hablas con el Dr. Marcus Chen, el asistente más cercano de Elena.
      Parece nervioso y evita el contacto visual.

      "Elena había estado actuando extraño últimamente... como si temiera por algo."

      * [Presionar para obtener más información] -> pressure_marcus
      * [Mostrar empatía y ganar su confianza] -> gain_trust
      * [Investigar el pasado de Marcus] -> investigate_marcus

      === check_computer ===
      ~ detective_skill += 2
      ~ evidence_found += 2

      Su computadora contiene emails encriptados y referencias a una reunión secreta
      la noche de su desaparición.

      Descubres que Elena había estado en contacto con alguien usando el alias "Phoenix".

      * [Rastrear la identidad de Phoenix] -> trace_phoenix
      * [Descifrar los emails] -> decrypt_emails
      * [Buscar la ubicación de la reunión] -> find_meeting_location

      === investigate_helix ===
      ~ evidence_found += 1

      El Proyecto Helix es clasificado, pero tus contactos revelan que involucra
      tecnología de teletransportación experimental.

      Elena había hecho un descubrimiento que podría cambiar el mundo... o destruirlo.

      * [Contactar agencias gubernamentales] -> contact_government
      * [Buscar otros científicos del proyecto] -> find_other_scientists

      === gain_trust ===
      ~ suspect_trust += 20

      Marcus se abre contigo. "Elena descubrió algo terrible sobre el proyecto.
      Dijo que algunas personas morirían para mantenerlo en secreto."

      Te entrega una llave que Elena le dio antes de desaparecer.

      * [Preguntar sobre las amenazas específicas] -> ask_threats
      * [Usar la llave inmediatamente] -> use_key

      === trace_phoenix ===
      ~ detective_skill += 3

      Phoenix resulta ser un informante del gobierno que había estado advirtiendo
      a Elena sobre los peligros de su investigación.

      {detective_skill >= 3} Has encontrado suficientes pistas para resolver el caso.

      * [Confrontar a los responsables] -> solve_case
      * [Buscar a Elena en las coordenadas] -> rescue_elena

      === solve_case ===
      ~ evidence_found += 3

      Con todas las piezas del rompecabezas, descubres que Elena no fue secuestrada:
      se escondió al descubrir que su investigación sería usada como arma.

      Logras reunirla con las autoridades correctas y expones la conspiración.

      ¡Has resuelto el caso y salvado tanto a Elena como al mundo!
      -> END

      === rescue_elena ===
      Siguiendo las coordenadas, encuentras a Elena escondida en un búnker secreto.

      "Sabía que alguien vendría a buscarme", dice aliviada.
      "Tenemos que detener el proyecto antes de que sea demasiado tarde."

      Juntos exponen la verdad y salvan el mundo de una tecnología peligrosa.
      -> END
    `;
  }
}
