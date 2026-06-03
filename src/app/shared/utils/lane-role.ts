/**
 * Convierte el lane_role numérico de OpenDota en un label corto.
 * OpenDota expone solo 1-4 (no distingue pos 4 de pos 5 sin net worth),
 * así que para soporte mostramos "Sup" sin número.
 */
export function laneRoleLabel(laneRole: number | null | undefined): string {
  switch (laneRole) {
    case 1: return 'Safe';
    case 2: return 'Mid';
    case 3: return 'Offlane';
    case 4: return 'Jungle';
    default: return '';
  }
}
