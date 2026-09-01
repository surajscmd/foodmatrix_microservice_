import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export interface CatalogMenuItem {
  menuItemId: string;
  name: string;
  sku: string;
  price: number;
  isAvailable: boolean;
}

export interface CatalogModifier {
  id: string;
  name: string;
  extraPrice: number;
  isActive: boolean;
}

export interface BulkCatalogResponse {
  menuItems: CatalogMenuItem[];
  modifiers: CatalogModifier[];
}

@Injectable()
export class CatalogGatewayService {
  private readonly baseUrl =
    process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002';

  private readonly internalApiKey = process.env.INTERNAL_API_KEY ?? '';

  async getBulkPricing(
    restaurantId: string,
    menuItemIds: string[],
    modifierIds: string[],
  ): Promise<BulkCatalogResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/catalog/bulk-pricing`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': this.internalApiKey,
          },

          body: JSON.stringify({
            restaurantId,
            menuItemIds,
            modifierIds,
          }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException(
          'Order Service is not authorized to access Catalog Service.',
        );
      }

      if (response.status === 404) {
        throw new NotFoundException('Catalog item was not found.');
      }

      if (!response.ok) {
        throw new BadGatewayException('Catalog Service returned an error.');
      }

      return (await response.json()) as BulkCatalogResponse;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      console.error('Catalog Service connection failed:', error);

      throw new BadGatewayException('Unable to connect to Catalog Service.');
    }
  }
}
