import { MigrationInterface, QueryRunner } from "typeorm";

export class createInnovationTransferTable1628247290724
  implements MigrationInterface {
  name = "createInnovationTransferTable1628247290724";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation_transfer table
    await queryRunner.query(`CREATE TABLE "innovation_transfer" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_transfer_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_transfer_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2, 
      "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_transfer_id" DEFAULT NEWSEQUENTIALID(), 
      "status" nvarchar(255) NOT NULL,
      "email" nvarchar(255) NOT NULL,
			"email_count" int NOT NULL DEFAULT 0,
      "finished_at" datetime2 NULL,
      "innovation_id" uniqueidentifier NOT NULL,
      CONSTRAINT "pk_innovation_transfer_id" PRIMARY KEY ("id")
		);`);

    await queryRunner.query(
      `ALTER TABLE "innovation_transfer" ADD CONSTRAINT "fk_innovation_transfer_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation_transfer table
    await queryRunner.query(
      `ALTER TABLE "innovation_transfer" DROP CONSTRAINT "fk_innovation_transfer_innovation_innovation_id"`
    );

    await queryRunner.query(`DROP TABLE "innovation_transfer"`);
  }
}
